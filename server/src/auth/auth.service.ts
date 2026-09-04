// ========================================================
// FluentUp - Auth Service
// ========================================================
// Yeh service user authentication aur profile operations handle karti hai.
// ========================================================

import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logged-in user ka clean profile data return karta hai.
   */
  getProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      level: user.level,
      approvalStatus: user.approvalStatus,
      assessmentScore: user.assessmentScore,
      totalSessions: user.totalSessions,
      totalMinutes: user.totalMinutes,
      topTopic: user.topTopic,
      createdAt: user.createdAt,
    };
  }

  /**
   * User ka display name update karne ke liye
   */
  async updateUsername(userId: string, newUsername: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { username: newUsername.trim() },
    });
    return this.getProfile(updated);
  }
}
