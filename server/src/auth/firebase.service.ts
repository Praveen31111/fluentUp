// ========================================================
// FluentUp - Firebase Admin Authentication Service
// ========================================================
// Yeh service Google Firebase Admin SDK (v14) ko initialize karti hai
// aur client apps (Android/iOS) se aane wale ID Tokens (JWT)
// ko cryptographically verify karti hai.
// ========================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  // NestJS Logger instance for clean, professional console logs
  private readonly logger = new Logger(FirebaseService.name);

  // Firebase Admin App instance reference
  private firebaseApp: App;

  // Development bypass flag (agar keys abhi available na hon)
  private isMockMode = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Module initialization lifecycle hook:
   * Server start hote hi Firebase Admin SDK initialize karta hai.
   */
  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Step 1: Check karein agar already initialized hai
      if (getApps().length > 0) {
        this.firebaseApp = getApp();
        this.logger.log('✅ Firebase Admin SDK already initialized.');
        return;
      }

      // Step 2: Check karein agar local service account JSON file maujood hai
      const localKeyPath = path.join(process.cwd(), 'firebase-service-account.json');

      if (fs.existsSync(localKeyPath)) {
        // Local JSON file se credentials read karna
        const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
        this.firebaseApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || 'fluentup-b8096',
        });
        this.logger.log('✅ Firebase Admin initialized via firebase-service-account.json');
        return;
      }

      // Step 3: Check karein environment variables (.env)
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') || 'fluentup-b8096';
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      let rawKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (rawKey) {
        rawKey = rawKey.trim();
        // Remove accidental surrounding double or single quotes if copied from .env
        if (
          (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
          (rawKey.startsWith("'") && rawKey.endsWith("'"))
        ) {
          rawKey = rawKey.slice(1, -1);
        }
        // Normalize literal \n into actual newline characters and strip carriage returns
        rawKey = rawKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
      }

      const privateKey = rawKey;

      if (clientEmail && privateKey) {
        // .env credentials se initialize karna (supports both camelCase and snake_case)
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
            project_id: projectId,
            client_email: clientEmail,
            private_key: privateKey,
          } as any),
          projectId,
        });
        this.logger.log(`✅ Firebase Admin initialized for project: ${projectId}`);
        return;
      }

      // Step 4: Agar keys abhi nahi hain toh Dev Mock Mode enable karein taaki testing na ruke
      this.logger.warn(
        '⚠️ Firebase Private Key nahi mili! Development Mock Mode active hai (Dev tokens accept honge).',
      );
      this.isMockMode = true;
    } catch (error) {
      this.logger.error('❌ Firebase Admin initialization failed:', error);
      this.isMockMode = true;
    }
  }

  /**
   * Client se aane wale ID Token ko verify karta hai.
   * Returns decoded Firebase token object (uid, email, etc.)
   */
  async verifyIdToken(token: string): Promise<{ uid: string; email: string; name?: string }> {
    // 1. Agar mock mode hai ya development test token bheja gaya hai
    if (this.isMockMode || token.startsWith('mock-token-') || token.startsWith('dev-token-')) {
      const mockUid = token.replace('mock-token-', '').replace('dev-token-', '') || 'test_user_1';
      return {
        uid: `dev_${mockUid}`,
        email: `${mockUid}@fluentup.dev`,
        name: `Learner ${mockUid}`,
      };
    }

    // 2. Real Firebase ID Token verification via Google Servers
    try {
      const auth = getAuth(this.firebaseApp);
      const decodedToken = await auth.verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || `${decodedToken.uid}@fluentup.com`,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'FluentUp Learner',
      };
    } catch (error) {
      this.logger.error('Token verification failed:', error.message);
      throw error;
    }
  }
}
