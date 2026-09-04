// ========================================================
// FluentUp - Safety & Moderation Service
// ========================================================
// Yeh service user safety aur abuse prevention handle karti hai:
// 1. reportUser: Inappropriate conduct report karna & auto-flag threshold.
// 2. blockUser: Partner ko block karna.
// 3. unblockUser: Block list se hatana.
// 4. isBlockedPair: Matchmaking mein blocked users ko match na hone dena.
// ========================================================

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockUserDto, ReportUserDto } from './dto/safety.dto';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Report User for Inappropriate Conduct
   * --------------------------------------------------------
   */
  async reportUser(reporterId: string, dto: ReportUserDto) {
    if (reporterId === dto.targetUserId) {
      throw new BadRequestException('You cannot report yourself.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
    });

    if (!target) {
      throw new NotFoundException('Target user not found.');
    }

    // Neon DB reports table mein complaint save karna
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetUserId: dto.targetUserId,
        reason: dto.reason.trim(),
        callId: dto.callId,
      },
    });

    // Auto-Moderation: Check karein agar is target user par 3 ya zyada reports aa chuki hain
    const reportCount = await this.prisma.report.count({
      where: { targetUserId: dto.targetUserId },
    });

    if (reportCount >= 3) {
      // 3 complaints aate hi user ko automatically suspend kar dena
      await this.prisma.user.update({
        where: { id: dto.targetUserId },
        data: { isBlocked: true },
      });
      this.logger.warn(`🚨 User ${target.username} (${target.id}) suspended automatically due to 3+ reports.`);
    }

    this.logger.log(`⚠️ Report filed against ${target.username} by user ${reporterId}: ${dto.reason}`);

    return {
      success: true,
      message: 'Report received. Our moderation team reviews all safety reports promptly.',
      reportId: report.id,
    };
  }

  /**
   * 2. Block Toxic Partner
   * --------------------------------------------------------
   * User ko block list mein add karta hai taaki matchmaking unhe dobara pair na kare.
   */
  async blockUser(userId: string, dto: BlockUserDto) {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    // Check user exists
    const target = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
    });

    if (!target) {
      throw new NotFoundException('Target user not found.');
    }

    // Block record create karna (agar already blocked hai toh duplicate error na aaye)
    await this.prisma.blockedUser.upsert({
      where: {
        userId_blockedUserId: {
          userId,
          blockedUserId: dto.targetUserId,
        },
      },
      update: {},
      create: {
        userId,
        blockedUserId: dto.targetUserId,
      },
    });

    this.logger.log(`🚫 User ${userId} blocked user ${dto.targetUserId} (${target.username}).`);

    return {
      success: true,
      message: `${target.username} has been blocked. You will never be matched with them again.`,
    };
  }

  /**
   * 3. Unblock User
   * --------------------------------------------------------
   */
  async unblockUser(userId: string, targetUserId: string) {
    await this.prisma.blockedUser.deleteMany({
      where: {
        userId,
        blockedUserId: targetUserId,
      },
    });

    return {
      success: true,
      message: 'User unblocked successfully.',
    };
  }

  /**
   * 4. Get Current User's Blocked List
   * --------------------------------------------------------
   */
  async getBlockedList(userId: string) {
    const blocked = await this.prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blockedUser: {
          select: {
            id: true,
            username: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocked.map((b) => ({
      id: b.blockedUser.id,
      username: b.blockedUser.username,
      level: b.blockedUser.level,
      blockedAt: b.createdAt,
    }));
  }

  /**
   * 5. Matchmaking Block Filter Check
   * --------------------------------------------------------
   * Returns true agar userA ne userB ko ya userB ne userA ko block kiya ho.
   */
  async isBlockedPair(userAId: string, userBId: string): Promise<boolean> {
    const blockCount = await this.prisma.blockedUser.count({
      where: {
        OR: [
          { userId: userAId, blockedUserId: userBId },
          { userId: userBId, blockedUserId: userAId },
        ],
      },
    });

    return blockCount > 0;
  }
}
