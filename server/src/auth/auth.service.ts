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
      address: user.address,
      education: user.education,
      hobbies: user.hobbies,
      bio: user.bio,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
    };
  }

  /**
   * User ka profile (name, address, education, hobbies, bio, photo) update karne ke liye
   */
  async updateProfile(
    userId: string,
    data: {
      username?: string;
      address?: string;
      education?: string;
      hobbies?: string[];
      bio?: string;
      photoUrl?: string;
    },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username ? { username: data.username.trim() } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
        ...(data.education !== undefined ? { education: data.education?.trim() || null } : {}),
        ...(data.hobbies !== undefined ? { hobbies: data.hobbies } : {}),
        ...(data.bio !== undefined ? { bio: data.bio?.trim() || null } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl?.trim() || null } : {}),
      },
    });
    return this.getProfile(updated);
  }
}
