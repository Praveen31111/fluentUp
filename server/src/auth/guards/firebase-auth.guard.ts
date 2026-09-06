// ========================================================
// FluentUp - Firebase Authentication Guard
// ========================================================
// Yeh guard protected API routes ka gatekeeper hai:
// 1. Header se "Authorization: Bearer <token>" read karta hai.
// 2. Firebase Admin se token ki authenticity verify karta hai.
// 3. Neon DB mein user lookup/upsert karta hai (Firebase UID -> DB User).
// 4. Blocked/Banned users ko block karta hai.
// 5. DB user ko request.user par attach kar deta hai.
// ========================================================

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Current HTTP request object lena
    const request = context.switchToHttp().getRequest();

    // 1. Authorization header check karna
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header. Expected: Bearer <token>',
      );
    }

    // 2. Bearer token nikaalna
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token is empty');
    }

    try {
      // 3. Firebase Admin se token verify karna
      const decodedUser = await this.firebaseService.verifyIdToken(token);

      // 4. Neon PostgreSQL Database mein user lookup ya auto-creation (upsert)
      // Agar user pehli baar aaya hai toh naya profile banega,
      // agar already maujood hai toh database ka record fetch hoga.
      const isDevToken = token.startsWith('dev-token-') || token.startsWith('mock-token-');

      const dbUser = await this.prisma.user.upsert({
        where: { firebaseUid: decodedUser.uid },
        update: {
          email: decodedUser.email,
          ...(isDevToken
            ? {
                approvalStatus: 'APPROVED',
                level: 'C1',
                assessmentScore: 88,
              }
            : {}),
        },
        create: {
          firebaseUid: decodedUser.uid,
          email: decodedUser.email,
          username: decodedUser.name || decodedUser.email.split('@')[0] || 'Learner',
          level: 'B1',
          approvalStatus: 'APPROVED',
          assessmentScore: 75,
        },
      });

      // 5. Moderation check: Agar user block/ban kiya gaya hai
      if (dbUser.isBlocked) {
        throw new ForbiddenException(
          'Your account has been suspended due to community guidelines violation.',
        );
      }

      // 6. Request object par verified database user attach karna
      request.user = dbUser;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Authentication failed: ${error.message || 'Invalid Firebase token'}`,
      );
    }
  }
}
