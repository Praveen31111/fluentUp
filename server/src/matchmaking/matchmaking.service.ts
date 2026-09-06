// ========================================================
// FluentUp - Matchmaking Service & Live Presence Engine
// ========================================================
// Yeh service 30-second peer-to-peer matchmaking queue chalati hai:
// 1. Strict Heartbeat Presence: Only users actively on the radar screen (within 5s) are matched.
// 2. Offline / closed-app users are immediately pruned and NEVER matched.
// 3. Busy Call Exclusion: Users in active conversations cannot be matched.
// 4. Stale Match Auto-Purge: Clean match consumption prevents ghost reconnects.
// 5. Tiered matching algorithm (Exact -> Adjacent -> Cross-Level).
// 6. Upstash Redis + In-Memory Dual Engine with background garbage collection.
// ========================================================

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallStatus, FluencyLevel, User } from '@prisma/client';
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

  // In-Memory Fallback Data Stores (Dual Engine with TTL & GC)
  private memoryQueue = new Map<string, QueuedLearner>();
  private memoryMatches = new Map<string, { match: MatchResult; createdAt: number }>();

  // Periodic garbage collector interval
  private cleanupInterval: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly safetyService: SafetyService,
  ) {}

  async onModuleInit() {
    await this.initRedis();
    // Run background garbage collector every 3.5 seconds
    this.cleanupInterval = setInterval(() => {
      this.runGarbageCollector();
    }, 3500);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
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
          tls: { rejectUnauthorized: false },
          maxRetriesPerRequest: null,
          connectTimeout: 10000,
          keepAlive: 10000,
          retryStrategy(times) {
            return Math.min(times * 1000, 5000);
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
   * Background Garbage Collector
   * Purges users who closed their app (no heartbeat in 5s) and matches older than 20s.
   */
  private runGarbageCollector() {
    const now = Date.now();

    // 1. Purge dead queue entries
    for (const [userId, learner] of this.memoryQueue.entries()) {
      const inactiveDuration = now - (learner.lastActiveAt || learner.joinedAt);
      const totalWait = now - learner.joinedAt;
      if (inactiveDuration > 5000 || totalWait > 35000) {
        this.memoryQueue.delete(userId);
      }
    }

    // 2. Purge stale matches
    for (const [userId, matchEntry] of this.memoryMatches.entries()) {
      if (now - matchEntry.createdAt > 20000) {
        this.memoryMatches.delete(userId);
      }
    }
  }

  /**
   * Check if a user is currently talking in an active ongoing call
   */
  public async isUserInActiveCall(userId: string): Promise<boolean> {
    try {
      const activeCall = await this.prisma.call.findFirst({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
          status: CallStatus.ACTIVE,
        },
        select: { id: true, startedAt: true },
      });

      if (activeCall) {
        const callAgeMinutes = (Date.now() - activeCall.startedAt.getTime()) / (1000 * 60);
        // Calls over 45 minutes are treated as abandoned/finished
        if (callAgeMinutes < 45) {
          return true;
        }
      }
    } catch (e) {
      // Ignored
    }
    return false;
  }

  /**
   * Clear any active or stale match and queue entries for a user
   */
  public async clearMatchForUser(userId: string) {
    this.memoryMatches.delete(userId);
    this.memoryQueue.delete(userId);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(`fluentup:match:${userId}`);
        await this.redisClient.del(`fluentup:queue:${userId}`);
      } catch (e) {
        // Ignored
      }
    }
  }

  /**
   * 1. Join Matchmaking Queue
   * --------------------------------------------------------
   * User ko 30s matching radar queue mein enter karta hai.
   * Purane stale matches wipe karke bilkul fresh search shuru karta hai.
   */
  async joinQueue(user: User): Promise<{ status: string; message: string; elapsedSeconds: number; match?: MatchResult }> {
    // Step 1: Wipe any old/stale matches so user is not reconnected to past callers
    await this.clearMatchForUser(user.id);

    // Step 2: Auto-calibrate beginner level so all users can practice freely
    const effectiveLevel =
      user.level === FluencyLevel.PENDING || !user.level
        ? FluencyLevel.B1
        : user.level;

    const now = Date.now();
    const learner: QueuedLearner = {
      userId: user.id,
      username: user.username,
      level: effectiveLevel,
      joinedAt: now,
      lastActiveAt: now,
      photoUrl: (user as any).photoUrl || null,
      address: (user as any).address || null,
      education: (user as any).education || null,
      hobbies: (user as any).hobbies || [],
    };

    // Step 3: Check for an active, online candidate already waiting in queue
    const matchedPartner = await this.findBestMatch(learner);

    if (matchedPartner) {
      // 🎉 Real active partner found!
      const matchResult = await this.createMatchSession(learner, matchedPartner);
      return { status: 'MATCHED', message: 'Partner found! Initializing call...', match: matchResult, elapsedSeconds: 0 };
    }

    // Agar abhi koi match nahi mila toh user ko queue mein add karein
    await this.addLearnerToQueue(learner);
    this.logger.log(`👤 User ${user.username} (${user.level}) joined live matchmaking queue.`);

    return { status: 'QUEUED', message: 'Searching for speaking partner...', elapsedSeconds: 0 };
  }

  /**
   * 2. Get Queue Status (Heartbeat Polling)
   * --------------------------------------------------------
   * Mobile app har 1.5 second mein radar ka status check karti hai.
   * Har call user ki live presence (lastActiveAt) ko refresh karti hai.
   */
  async getStatus(userId: string) {
    // 1. Check karein agar match ho gaya hai
    const match = await this.getMatchForUser(userId);
    if (match) {
      // Consume the match so it won't be returned repeatedly on subsequent entries
      await this.clearMatchForUser(userId);
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

    // Refresh live presence timestamp (heartbeat)
    await this.touchLearnerInQueue(userId);

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

    // 3. Search for available active partners while waiting
    const matchedPartner = await this.findBestMatch(queuedUser);
    if (matchedPartner) {
      const matchResult = await this.createMatchSession(queuedUser, matchedPartner);
      await this.clearMatchForUser(userId);
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
    await this.clearMatchForUser(userId);
    return { status: 'CANCELLED', message: 'Matchmaking cancelled successfully.' };
  }

  /**
   * --------------------------------------------------------
   * Tiered Matching Engine Algorithm
   * --------------------------------------------------------
   * 1. ONLY actively online learners (heartbeat within 5 seconds) are considered.
   * 2. Users currently in active calls are strictly excluded.
   * 3. 0 - 10s: Exact same level (B1-B1, B2-B2, C1-C1)
   * 4. 10 - 20s: Adjacent level (B1-B2, B2-C1)
   * 5. 20 - 30s: Cross-level (any available online learner)
   */
  private async findBestMatch(currentLearner: QueuedLearner): Promise<QueuedLearner | null> {
    const allQueued = await this.getAllQueuedLearners();
    const now = Date.now();

    // Strict Online & Availability Filter
    const candidates: QueuedLearner[] = [];
    for (const l of allQueued) {
      if (l.userId === currentLearner.userId) continue;

      // Filter 1: Check live heartbeat presence (must have polled within last 5s)
      const lastSeenAgoMs = now - (l.lastActiveAt || l.joinedAt);
      if (lastSeenAgoMs > 5000) {
        this.logger.log(`🧹 Pruning offline learner ${l.username} (last seen ${Math.round(lastSeenAgoMs / 1000)}s ago)`);
        await this.removeLearnerFromQueue(l.userId);
        continue;
      }

      // Filter 2: Safety block check
      const isBlocked = await this.safetyService.isBlockedPair(currentLearner.userId, l.userId);
      if (isBlocked) continue;

      // Filter 3: Check if candidate is already in an active ongoing call
      const isBusy = await this.isUserInActiveCall(l.userId);
      if (isBusy) {
        this.logger.log(`⏳ Candidate ${l.username} is currently busy in an ongoing call.`);
        await this.removeLearnerFromQueue(l.userId);
        continue;
      }

      candidates.push(l);
    }

    if (candidates.length === 0) return null;

    const waitDurationSec = Math.floor((now - currentLearner.joinedAt) / 1000);

    // Tier 1: Exact level match
    const exactMatch = candidates.find((c) => c.level === currentLearner.level);
    if (exactMatch) return exactMatch;

    // Tier 2: Adjacent level match after 10 seconds
    if (waitDurationSec >= 10) {
      const adjacentMatch = candidates.find((c) => this.isAdjacentLevel(currentLearner.level, c.level));
      if (adjacentMatch) return adjacentMatch;
    }

    // Tier 3: Any approved active online partner after 20 seconds
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
   * Match Session Creation:
   * 1. Dono users ko queue se remove karta hai.
   * 2. Unique room ID aur topic assign karta hai.
   * 3. PostgreSQL database ke calls table mein session save karta hai.
   * 4. Dono users ke liye fresh match payload store karta hai.
   */
  private async createMatchSession(
    learnerA: QueuedLearner,
    learnerB: QueuedLearner,
  ): Promise<MatchResult> {
    // Dono ko queue se remove karna
    await this.removeLearnerFromQueue(learnerA.userId);
    await this.removeLearnerFromQueue(learnerB.userId);

    // Unique Room Name generate karna
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
        status: CallStatus.ACTIVE,
      },
    });

    // Fresh user profiles fetch karein
    const [dbUserA, dbUserB] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: learnerA.userId } }),
      this.prisma.user.findUnique({ where: { id: learnerB.userId } }),
    ]);

    const actualA = dbUserA || learnerA;
    const actualB = dbUserB || learnerB;
    const matchTime = Date.now();

    // Match payload for Learner A
    const matchForA: MatchResult = {
      callId: callRecord.id,
      roomName,
      topic: randomTopic,
      createdAt: matchTime,
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

    // Match payload for Learner B
    const matchForB: MatchResult = {
      callId: callRecord.id,
      roomName,
      topic: randomTopic,
      createdAt: matchTime,
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

    // Store match results with TTL
    await this.setMatchResult(learnerA.userId, matchForA);
    await this.setMatchResult(learnerB.userId, matchForB);

    this.logger.log(
      `🎉 Live Match Created: ${learnerA.username} (${learnerA.level}) <-> ${learnerB.username} (${learnerB.level}) in Room: ${roomName}`,
    );

    return matchForA;
  }

  // --- Queue & Match Storage Helpers ---

  private async addLearnerToQueue(learner: QueuedLearner) {
    this.memoryQueue.set(learner.userId, learner);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(
          `fluentup:queue:${learner.userId}`,
          JSON.stringify(learner),
          'EX',
          35,
        );
      } catch (e) {}
    }
  }

  private async touchLearnerInQueue(userId: string) {
    const learner = this.memoryQueue.get(userId);
    if (learner) {
      learner.lastActiveAt = Date.now();
    }
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(`fluentup:queue:${userId}`);
        if (data) {
          const parsed = JSON.parse(data) as QueuedLearner;
          parsed.lastActiveAt = Date.now();
          await this.redisClient.set(
            `fluentup:queue:${userId}`,
            JSON.stringify(parsed),
            'EX',
            35,
          );
        }
      } catch (e) {}
    }
  }

  private async getLearnerFromQueue(userId: string): Promise<QueuedLearner | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(`fluentup:queue:${userId}`);
        if (data) return JSON.parse(data);
      } catch (e) {}
    }
    return this.memoryQueue.get(userId) || null;
  }

  private async removeLearnerFromQueue(userId: string) {
    this.memoryQueue.delete(userId);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(`fluentup:queue:${userId}`);
      } catch (e) {}
    }
  }

  private async getAllQueuedLearners(): Promise<QueuedLearner[]> {
    let all: QueuedLearner[] = [];
    if (this.isRedisConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys('fluentup:queue:*');
        if (keys.length > 0) {
          const values = await this.redisClient.mget(keys);
          all = values
            .filter((v): v is string => v !== null)
            .map((v) => JSON.parse(v) as QueuedLearner);
        }
      } catch (e) {
        all = Array.from(this.memoryQueue.values());
      }
    } else {
      all = Array.from(this.memoryQueue.values());
    }

    const now = Date.now();
    const activeLearners: QueuedLearner[] = [];

    for (const learner of all) {
      // If learner last polled > 5 seconds ago or total wait > 35s, they are offline/timed out
      if (now - (learner.lastActiveAt || learner.joinedAt) > 5000 || now - learner.joinedAt > 35000) {
        this.removeLearnerFromQueue(learner.userId).catch(() => {});
      } else {
        activeLearners.push(learner);
      }
    }

    return activeLearners;
  }

  private async setMatchResult(userId: string, match: MatchResult) {
    this.memoryMatches.set(userId, { match, createdAt: Date.now() });
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(
          `fluentup:match:${userId}`,
          JSON.stringify(match),
          'EX',
          25, // 25 seconds TTL
        );
      } catch (e) {}
    }
  }

  private async getMatchForUser(userId: string): Promise<MatchResult | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(`fluentup:match:${userId}`);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {}
    }

    const record = this.memoryMatches.get(userId);
    if (record) {
      // Expire matches older than 20 seconds
      if (Date.now() - record.createdAt > 20000) {
        this.memoryMatches.delete(userId);
        return null;
      }
      return record.match;
    }

    return null;
  }
}
