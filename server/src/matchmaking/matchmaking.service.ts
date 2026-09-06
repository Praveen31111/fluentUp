// ========================================================
// FluentUp - Matchmaking Service & Redis Matching Worker
// ========================================================
// Yeh service 30-second peer-to-peer matchmaking queue chalati hai:
// 1. Approved users ko queue mein add karna.
// 2. Tiered matching algorithm (Exact -> Adjacent -> Cross-Level).
// 3. Conversation starter topic aur unique room generate karna.
// 4. Neon DB calls table mein record create karna.
// 5. Upstash Redis + In-Memory Fallback dual-engine support.
// ========================================================

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApprovalStatus, FluencyLevel, User } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import { CONVERSATION_TOPICS, MatchResult, QueuedLearner } from './matchmaking.types';

@Injectable()
export class MatchmakingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchmakingService.name);

  // Redis Client instance (Upstash Cloud Redis)
  private redisClient: Redis | null = null;
  private isRedisConnected = false;

  // In-Memory Fallback Data Stores (Agar Redis kisi waqt unreachable ho)
  private memoryQueue = new Map<string, QueuedLearner>();
  private memoryMatches = new Map<string, MatchResult>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly safetyService: SafetyService,
  ) {}

  /**
   * Application start hote hi Upstash Redis se connect hona
   */
  async onModuleInit() {
    await this.initRedis();
  }

  /**
   * Application band hote hi Redis connection close karna
   */
  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('🔌 Disconnected from Upstash Redis');
    }
  }

  private async initRedis() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl && redisUrl.startsWith('rediss://')) {
      try {
        this.redisClient = new Redis(redisUrl, {
          tls: { rejectUnauthorized: false }, // Upstash SSL requirement
          maxRetriesPerRequest: null,
          connectTimeout: 10000,
          keepAlive: 10000, // Sends TCP keepalive so Upstash does not drop idle connection
          retryStrategy(times) {
            // Reconnect smoothly with backoff (max 5s)
            const delay = Math.min(times * 1000, 5000);
            return delay;
          },
        });

        this.redisClient.on('connect', () => {
          this.isRedisConnected = true;
          this.logger.log('🚀 Connected to Upstash Cloud Redis successfully!');
        });

        this.redisClient.on('error', (err) => {
          this.isRedisConnected = false;
          this.logger.warn(`⚠️ Redis notice: ${err.message}. Using In-Memory engine fallback.`);
        });
      } catch (e) {
        this.logger.warn('⚠️ Could not initialize Redis client, using In-Memory queue fallback.');
      }
    } else {
      this.logger.log('ℹ️ Running Matchmaking with high-speed In-Memory Queue.');
    }
  }

  /**
   * 1. Join Matchmaking Queue
   * --------------------------------------------------------
   * User ko 30s matching radar queue mein enter karta hai.
   */
  async joinQueue(user: User): Promise<{ status: string; message: string; elapsedSeconds: number; match?: MatchResult }> {
    // Check 1: Agar user ka already koi active match ready hai
    const existingMatch = await this.getMatchForUser(user.id);
    if (existingMatch) {
      return { status: 'MATCHED', message: 'Partner already matched!', match: existingMatch, elapsedSeconds: 0 };
    }

    // Auto-calibrate beginner level so all users can practice freely
    const effectiveLevel =
      user.level === FluencyLevel.PENDING || !user.level
        ? FluencyLevel.B1
        : user.level;

    const learner: QueuedLearner = {
      userId: user.id,
      username: user.username,
      level: effectiveLevel,
      joinedAt: Date.now(),
      photoUrl: (user as any).photoUrl || null,
      address: (user as any).address || null,
      education: (user as any).education || null,
      hobbies: (user as any).hobbies || [],
    };

    // Step 4: Queue mein pehle se maujood users ke saath match dhoondhna
    const matchedPartner = await this.findBestMatch(learner);

    if (matchedPartner) {
      // 🎉 Match mil gaya!
      await this.createMatchSession(learner, matchedPartner);
      return { status: 'MATCHED', message: 'Partner found! Initializing call...', elapsedSeconds: 0 };
    }

    // Agar abhi koi match nahi mila toh user ko queue mein add karein
    await this.addLearnerToQueue(learner);
    this.logger.log(`👤 User ${user.username} (${user.level}) joined matchmaking queue.`);

    return { status: 'QUEUED', message: 'Searching for speaking partner...', elapsedSeconds: 0 };
  }

  /**
   * 2. Get Queue Status (Polling)
   * --------------------------------------------------------
   * Mobile app har 1-2 second mein radar ka status check karti hai:
   * Returns: QUEUED, MATCHED, TIMEOUT, ya IDLE.
   */
  async getStatus(userId: string) {
    // 1. Check karein agar match ho gaya hai
    const match = await this.getMatchForUser(userId);
    if (match) {
      return {
        status: 'MATCHED',
        match,
      };
    }

    // 2. Check karein agar user abhi bhi queue mein hai
    const queuedUser = await this.getLearnerFromQueue(userId);
    if (!queuedUser) {
      return {
        status: 'IDLE',
        message: 'Not currently in queue.',
      };
    }

    // Elapsed time calculate karein
    const elapsedSeconds = Math.floor((Date.now() - queuedUser.joinedAt) / 1000);

    // 30 seconds timeout check
    if (elapsedSeconds >= 30) {
      await this.removeLearnerFromQueue(userId);
      return {
        status: 'TIMEOUT',
        message: 'No partner available right now. Please tap Find Partner to retry.',
      };
    }

    // Agar waiting hai toh fir se check karein agar koi naya partner queue mein aaya ho
    const matchedPartner = await this.findBestMatch(queuedUser);
    if (matchedPartner) {
      const matchResult = await this.createMatchSession(queuedUser, matchedPartner);
      return {
        status: 'MATCHED',
        match: matchResult,
      };
    }

    return {
      status: 'QUEUED',
      elapsedSeconds,
      level: queuedUser.level,
    };
  }

  /**
   * 3. Cancel Matchmaking
   * --------------------------------------------------------
   * User jab radar screen par "Cancel" dabata hai.
   */
  async cancelQueue(userId: string) {
    await this.removeLearnerFromQueue(userId);
    this.memoryMatches.delete(userId);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(`fluentup:match:${userId}`);
      } catch (e) {
        // Ignored
      }
    }
    return { status: 'CANCELLED', message: 'Matchmaking cancelled successfully.' };
  }

  /**
   * --------------------------------------------------------
   * Tiered Matching Engine Algorithm
   * --------------------------------------------------------
   * 1. 0 - 10s: Exact same level (B1-B1, B2-B2, C1-C1)
   * 2. 10 - 20s: Adjacent level (B1-B2, B2-C1)
   * 3. 20 - 30s: Cross-level (any approved learner)
   */
  private async findBestMatch(currentLearner: QueuedLearner): Promise<QueuedLearner | null> {
    const allQueued = await this.getAllQueuedLearners();

    // Self aur Blocked users ko exclude karein (Safety filter)
    const candidates: QueuedLearner[] = [];
    for (const l of allQueued) {
      if (l.userId !== currentLearner.userId) {
        const isBlocked = await this.safetyService.isBlockedPair(currentLearner.userId, l.userId);
        if (!isBlocked) {
          candidates.push(l);
        }
      }
    }
    if (candidates.length === 0) return null;

    const waitDurationSec = Math.floor((Date.now() - currentLearner.joinedAt) / 1000);

    // Tier 1: Exact level match
    const exactMatch = candidates.find((c) => c.level === currentLearner.level);
    if (exactMatch) return exactMatch;

    // Tier 2: Agar 10 second se zyada wait ho chuka ho -> Adjacent level
    if (waitDurationSec >= 10) {
      const adjacentMatch = candidates.find((c) => this.isAdjacentLevel(currentLearner.level, c.level));
      if (adjacentMatch) return adjacentMatch;
    }

    // Tier 3: Agar 20 second se zyada wait ho chuka ho -> Koi bhi available partner
    if (waitDurationSec >= 20 && candidates.length > 0) {
      return candidates[0];
    }

    return null;
  }

  private isAdjacentLevel(lvlA: FluencyLevel, lvlB: FluencyLevel): boolean {
    const order: FluencyLevel[] = [FluencyLevel.B1, FluencyLevel.B2, FluencyLevel.C1];
    const idxA = order.indexOf(lvlA);
    const idxB = order.indexOf(lvlB);
    if (idxA === -1 || idxB === -1) return false;
    return Math.abs(idxA - idxB) === 1;
  }

  /**
   * Match Session Banane Ka Core Logic:
   * 1. Dono users ko queue se remove karta hai.
   * 2. Unique room ID aur topic select karta hai.
   * 3. PostgreSQL database ke `calls` table mein session save karta hai.
   * 4. Dono users ke liye match result ready karta hai.
   */
  private async createMatchSession(
    learnerA: QueuedLearner,
    learnerB: QueuedLearner,
  ): Promise<MatchResult> {
    // Dono ko queue se remove karna
    await this.removeLearnerFromQueue(learnerA.userId);
    await this.removeLearnerFromQueue(learnerB.userId);

    // Unique Room Name generate karna: e.g. call_flup_38dj92
    const roomName = `call_flup_${Math.random().toString(36).substring(2, 10)}`;

    // Random curated topic select karna
    const randomTopic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];

    // Neon PostgreSQL calls table mein record create karna
    const callRecord = await this.prisma.call.create({
      data: {
        userAId: learnerA.userId,
        userBId: learnerB.userId,
        roomName,
        matchedLevel: learnerA.level,
        sharedTopic: randomTopic,
      },
    });

    // Fresh user profiles fetch karein taaki updated photoUrl, address, hobbies dono partners ko live dikhein
    const [dbUserA, dbUserB] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: learnerA.userId } }),
      this.prisma.user.findUnique({ where: { id: learnerB.userId } }),
    ]);

    const actualA = dbUserA || learnerA;
    const actualB = dbUserB || learnerB;

    // Learner A ke liye match payload (User B ka updated profile dikhayega)
    const matchForA: MatchResult = {
      callId: callRecord.id,
      roomName,
      topic: randomTopic,
      partner: {
        id: learnerB.userId,
        name: (actualB as any).username || learnerB.username,
        level: (actualB as any).level || learnerB.level,
        photoUrl: (actualB as any).photoUrl || learnerB.photoUrl || null,
        address: (actualB as any).address || learnerB.address || null,
        education: (actualB as any).education || learnerB.education || null,
        hobbies: (actualB as any).hobbies && (actualB as any).hobbies.length > 0 ? (actualB as any).hobbies : learnerB.hobbies,
      },
    };

    // Learner B ke liye match payload (User A ka updated profile dikhayega)
    const matchForB: MatchResult = {
      callId: callRecord.id,
      roomName,
      topic: randomTopic,
      partner: {
        id: learnerA.userId,
        name: (actualA as any).username || learnerA.username,
        level: (actualA as any).level || learnerA.level,
        photoUrl: (actualA as any).photoUrl || learnerA.photoUrl || null,
        address: (actualA as any).address || learnerA.address || null,
        education: (actualA as any).education || learnerA.education || null,
        hobbies: (actualA as any).hobbies && (actualA as any).hobbies.length > 0 ? (actualA as any).hobbies : learnerA.hobbies,
      },
    };

    // Match results store karna
    await this.setMatchResult(learnerA.userId, matchForA);
    await this.setMatchResult(learnerB.userId, matchForB);

    this.logger.log(
      `🎉 Match created: ${learnerA.username} (${learnerA.level}) <-> ${learnerB.username} (${learnerB.level}) in Room: ${roomName}`,
    );

    return matchForA;
  }

  // --- Queue Storage Helpers (Upstash Redis with In-Memory Fallback) ---

  private async addLearnerToQueue(learner: QueuedLearner) {
    this.memoryQueue.set(learner.userId, learner);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(
          `fluentup:queue:${learner.userId}`,
          JSON.stringify(learner),
          'EX',
          35, // 35 seconds TTL
        );
      } catch (e) {
        // Ignored, memory fallback already set
      }
    }
  }

  private async getLearnerFromQueue(userId: string): Promise<QueuedLearner | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(`fluentup:queue:${userId}`);
        if (data) return JSON.parse(data);
      } catch (e) {
        // Fallback to memory
      }
    }
    return this.memoryQueue.get(userId) || null;
  }

  private async removeLearnerFromQueue(userId: string) {
    this.memoryQueue.delete(userId);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(`fluentup:queue:${userId}`);
      } catch (e) {
        // Ignored
      }
    }
  }

  private async getAllQueuedLearners(): Promise<QueuedLearner[]> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys('fluentup:queue:*');
        if (keys.length > 0) {
          const values = await this.redisClient.mget(keys);
          return values
            .filter((v): v is string => v !== null)
            .map((v) => JSON.parse(v) as QueuedLearner);
        }
      } catch (e) {
        // Fallback to memory
      }
    }
    return Array.from(this.memoryQueue.values());
  }

  private async setMatchResult(userId: string, match: MatchResult) {
    this.memoryMatches.set(userId, match);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(
          `fluentup:match:${userId}`,
          JSON.stringify(match),
          'EX',
          60, // 60 seconds TTL
        );
      } catch (e) {
        // Ignored
      }
    }
  }

  private async getMatchForUser(userId: string): Promise<MatchResult | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(`fluentup:match:${userId}`);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        // Fallback to memory
      }
    }

    if (this.memoryMatches.has(userId)) {
      return this.memoryMatches.get(userId)!;
    }

    return null;
  }
}
