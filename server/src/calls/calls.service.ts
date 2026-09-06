// ========================================================
// FluentUp - Calls Service
// ========================================================
// Yeh service audio call sessions manage karti hai:
// 1. Call duration calculate karna.
// 2. Neon DB ke calls table mein status COMPLETED mark karna.
// 3. Dono users ko practice minutes aur completed sessions credit karna.
// 4. 1-to-5 star feedback record karna.
// ========================================================

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CallStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CallSummaryResponse, SubmitFeedbackDto } from './dto/call-feedback.dto';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. End Call Session & Credit Spoken Minutes
   * --------------------------------------------------------
   * Jab koi user call kaat ta hai ya time pura hota hai:
   * Duration calculate hoti hai aur dono users ke profile mein minutes judte hain.
   */
  async endCallSession(
    roomName: string,
    endedByUserId: string,
    reportedDurationSec?: number,
  ): Promise<CallSummaryResponse | null> {
    // Database se room ke mutabiq call dhoondhna
    const call = await this.prisma.call.findUnique({
      where: { roomName },
      include: {
        userA: true,
        userB: true,
      },
    });

    if (!call) {
      this.logger.warn(`Call not found for room: ${roomName}`);
      return null;
    }

    // Agar call pehle se hi complete ho chuki ho toh duplicate credit na karein
    if (call.status === CallStatus.COMPLETED) {
      const durationMinutes = Math.max(1, Math.ceil(call.durationSeconds / 60));
      return {
        callId: call.id,
        roomName: call.roomName,
        durationSeconds: call.durationSeconds,
        durationMinutes,
        topic: call.sharedTopic,
        partnerName: endedByUserId === call.userAId ? call.userB.username : call.userA.username,
        endedAt: call.endedAt || new Date(),
      };
    }

    // Call duration calculate karna (seconds mein)
    const now = new Date();
    const calculatedSec = Math.max(
      1,
      Math.floor((now.getTime() - call.startedAt.getTime()) / 1000),
    );
    const finalDurationSec = reportedDurationSec && reportedDurationSec > 0
      ? reportedDurationSec
      : calculatedSec;

    // Seconds ko rounded minutes mein convert karna
    const practiceMinutes = Math.max(1, Math.ceil(finalDurationSec / 60));

    // Neon DB mein Call status COMPLETED aur duration save karna
    await this.prisma.call.update({
      where: { id: call.id },
      data: {
        status: CallStatus.COMPLETED,
        endedAt: now,
        durationSeconds: finalDurationSec,
      },
    });

    // Dono learners ke accounts mein practice minutes aur session credit karna
    await this.prisma.user.update({
      where: { id: call.userAId },
      data: {
        totalSessions: { increment: 1 },
        totalMinutes: { increment: practiceMinutes },
      },
    });

    await this.prisma.user.update({
      where: { id: call.userBId },
      data: {
        totalSessions: { increment: 1 },
        totalMinutes: { increment: practiceMinutes },
      },
    });

    this.logger.log(
      `📞 Call completed: Room ${roomName}, Duration: ${finalDurationSec}s (${practiceMinutes} mins credited).`,
    );

    const partnerName =
      endedByUserId === call.userAId ? call.userB.username : call.userA.username;

    return {
      callId: call.id,
      roomName: call.roomName,
      durationSeconds: finalDurationSec,
      durationMinutes: practiceMinutes,
      topic: call.sharedTopic,
      partnerName,
      endedAt: now,
    };
  }

  /**
   * 2. Save 1-to-5 Star Session Feedback
   * --------------------------------------------------------
   */
  async submitFeedback(callId: string, authorId: string, dto: SubmitFeedbackDto) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call session not found');
    }

    // Rating validate karna (1 se 5 stars)
    const rating = Math.min(5, Math.max(1, dto.rating || 5));

    const feedback = await this.prisma.callFeedback.create({
      data: {
        callId,
        authorId,
        rating,
        flowQuality: dto.flowQuality || 'great',
      },
    });

    return {
      success: true,
      message: 'Thank you for your feedback! It helps keep conversations high quality.',
      feedbackId: feedback.id,
    };
  }

  /**
   * 3. Get User Call History
   * --------------------------------------------------------
   * Profile screen par completed sessions list dikhane ke liye
   */
  async getUserHistory(userId: string) {
    const calls = await this.prisma.call.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: CallStatus.COMPLETED,
      },
      orderBy: { startedAt: 'desc' },
      take: 20, // Last 20 calls
      include: {
        userA: { select: { id: true, username: true, level: true } },
        userB: { select: { id: true, username: true, level: true } },
      },
    });

    return calls.map((c) => {
      const partner = c.userAId === userId ? c.userB : c.userA;
      return {
        id: c.id,
        roomName: c.roomName,
        topic: c.sharedTopic,
        durationSeconds: c.durationSeconds,
        durationMinutes: Math.max(1, Math.ceil(c.durationSeconds / 60)),
        startedAt: c.startedAt,
        partner: {
          name: partner.username,
          level: partner.level,
        },
      };
    });
  }

  /**
   * 4. Get Dynamic Production ICE Servers (STUN & TURN)
   * --------------------------------------------------------
   * Mobile app ko Carrier-Grade NAT traversal ke liye reliable
   * STUN aur TURN configuration supply karna.
   */
  async getIceServers() {
    const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ];

    const turnUrls = process.env.TURN_URLS;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;

    if (turnUrls && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrls.split(','),
        username: turnUsername,
        credential: turnCredential,
      });
    } else {
      iceServers.push({
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelay',
        credential: 'openrelay',
      });
    }

    return { iceServers };
  }
}
