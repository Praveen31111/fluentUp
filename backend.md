# FluentUp - Complete Backend Architecture & Step-by-Step Implementation Guide

"Find someone. Speak English. Get better."  
Yeh document FluentUp ke backend ka complete, production-ready blueprint hai. Isme **₹0-cost MVP architecture**, **NestJS modular structure**, **PostgreSQL database schema**, **Redis 30-second matchmaking algorithm**, **WebRTC audio signaling**, aur **abuse protection** ka step-by-step plan shamil hai.

---

## 🏗️ 1. Core Backend Architecture Overview

FluentUp ka backend modular aur secure design kiya gaya hai:

```
                  React Native Mobile App (FluentUp)
                               │
               HTTPS (REST API)│ WebSocket (Socket.IO)
                               ▼
                    ┌─────────────────────┐
                    │   NestJS Backend    │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    Auth Guard           Matchmaking Engine     WebRTC Signaling
  (Firebase Token)        (Redis Queues)      (Socket.IO Gateway)
         │                     │                     │
         ▼                     ▼                     ▼
    PostgreSQL           Redis (Upstash)      P2P Audio Stream
   (Neon / Prisma)      (Queue State & TTL)  (Direct WebRTC Mesh)
```

> [!IMPORTANT]
> **Audio Traffic Zero-Server-Cost**:
> Actual speech conversation WebSocket ya server ke through transmit nahi hoti! Socket.IO sirf **Signaling (SDP Offer/Answer aur ICE Candidates)** exchange karta hai. Audio direct peer-to-peer WebRTC stream se chalti hai, jisse server par 0 bandwidth cost aati hai.

---

## 💰 2. ₹0-Cost Production Stack (Free Tier Breakdown)

| Component | Technology | Free Tier Service | Cost |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | NestJS (TypeScript) | Render / Railway / Fly.io | **₹0** |
| **Database** | PostgreSQL + Prisma ORM | Neon.tech (0.5GB storage, autoscaling) | **₹0** |
| **Fast In-Memory Cache** | Redis | Upstash Redis (10,000 requests/day) | **₹0** |
| **Authentication** | Firebase Admin SDK | Firebase Auth (Unlimited Email/Password) | **₹0** |
| **Audio NAT Traversal** | STUN Server | Google Public STUN (`stun:stun.l.google.com:19302`) | **₹0** |
| **Code Repository** | GitHub | GitHub Actions CI/CD | **₹0** |

---

## 🗄️ 3. Database Schema (PostgreSQL via Prisma ORM)

Database ko clean aur focused rakha gaya hai:

```prisma
// 1. Users Table (Stores verified English level and status)
model User {
  id               String           @id @default(uuid())
  firebaseUid      String           @unique
  email            String           @unique
  username         String
  level            FluencyLevel     @default(PENDING)
  assessmentScore  Int              @default(0)
  approvalStatus   ApprovalStatus   @default(PENDING)
  totalSessions    Int              @default(0)
  totalMinutes     Int              @default(0)
  topTopic         String?          @default("Daily Routines")
  isBlocked        Boolean          @default(false)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  assessments      AssessmentAttempt[]
  callsAsUserA     Call[]           @relation("CallUserA")
  callsAsUserB     Call[]           @relation("CallUserB")
  feedbackGiven    CallFeedback[]   @relation("FeedbackAuthor")
  reportsFiled     Report[]         @relation("ReportAuthor")
  reportsReceived  Report[]         @relation("ReportTarget")
  blockedUsers     BlockedUser[]    @relation("BlockInitiator")
  blockedBy        BlockedUser[]    @relation("BlockedTarget")

  @@map("users")
}

enum FluencyLevel {
  PENDING
  A1
  A2
  B1
  B2
  C1
  C2
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

// 2. Assessment Questions & Secure Server Evaluation
model AssessmentQuestion {
  id           Int      @id @default(autoincrement())
  category     String   // Idiomatic, Phrasal, Polite Disagreement
  prompt       String   // Question title
  instruction  String   // Helpful context
  options      String[] // Array of 3 options
  correctIndex Int      // Server-only! Client ko nahi bheja jayega
  difficulty   String   // B1, B2, C1
  isActive     Boolean  @default(true)

  @@map("assessment_questions")
}

model AssessmentAttempt {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  score        Int      // 0 - 100
  assignedLevel FluencyLevel
  passed       Boolean
  answersJson  Json     // Submitted indices
  createdAt    DateTime @default(now())

  @@map("assessment_attempts")
}

// 3. Audio Calls Table
model Call {
  id             String         @id @default(uuid())
  userAId        String
  userBId        String
  userA          User           @relation("CallUserA", fields: [userAId], references: [id])
  userB          User           @relation("CallUserB", fields: [userBId], references: [id])
  roomName       String         @unique // call_<uuid>
  matchedLevel   FluencyLevel
  sharedTopic    String
  startedAt      DateTime       @default(now())
  endedAt        DateTime?
  durationSeconds Int           @default(0)
  status         CallStatus     @default(ACTIVE)

  feedbacks      CallFeedback[]

  @@map("calls")
}

enum CallStatus {
  ACTIVE
  COMPLETED
  DISCONNECTED
  CANCELLED
}

// 4. Session Feedback Table
model CallFeedback {
  id             String   @id @default(uuid())
  callId         String
  call           Call     @relation(fields: [callId], references: [id], onDelete: Cascade)
  authorId       String
  author         User     @relation("FeedbackAuthor", fields: [authorId], references: [id])
  rating         Int      // 1 to 5 stars
  flowQuality    String   // great, somewhat, nomatch
  createdAt      DateTime @default(now())

  @@map("call_feedbacks")
}

// 5. Abuse Prevention & Safety Tables
model Report {
  id             String   @id @default(uuid())
  reporterId     String
  reporter       User     @relation("ReportAuthor", fields: [reporterId], references: [id])
  targetUserId   String
  targetUser     User     @relation("ReportTarget", fields: [targetUserId], references: [id])
  callId         String?
  reason         String
  status         String   @default("PENDING") // PENDING, REVIEWED, ACTION_TAKEN
  createdAt      DateTime @default(now())

  @@map("reports")
}

model BlockedUser {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation("BlockInitiator", fields: [userId], references: [id])
  blockedUserId  String
  blockedUser    User     @relation("BlockedTarget", fields: [blockedUserId], references: [id])
  createdAt      DateTime @default(now())

  @@unique([userId, blockedUserId])
  @@map("blocked_users")
}
```

---

## ⚡ 4. Redis Matchmaking Engine (30-Second Algorithm)

PostgreSQL mein matchmaking queue continuously insert/delete nahi ki jati. Fast in-memory **Redis Sorted Sets (ZSET)** aur **Pub/Sub** use kiya jata hai:

### Queue Architecture:
- Redis Keys:
  - `speaking:queue:B1` (Timestamp score ke sath)
  - `speaking:queue:B2`
  - `speaking:queue:C1`
  - `user:presence:<userId>` (Heartbeat TTL: 15s)

### 30-Second Step-by-Step Algorithm:

1. **User joins queue** (`POST /matchmaking/join` ya Socket event `queue.join`):
   - Server database se verified CEFR level dekhta hai (Client ke claim par trust nahi karta).
   - User ko uske level ki queue mein add karta hai: `ZADD speaking:queue:B2 <timestamp> <userId>`.

2. **0 to 10 Seconds (Exact Match Window)**:
   - Server usi queue (`speaking:queue:B2`) mein dusre waiting user ko check karta hai.
   - Agar partner mil gaya $\rightarrow$ Dono ko pop karta hai, Call session create karta hai, aur Socket event `match.found` emit karta hai.

3. **10 to 20 Seconds (Adjacent Level Window)**:
   - Agar exact level nahi mila, toh adjacent queues check hoti hain:
     - B1 $\leftrightarrow$ B2
     - B2 $\leftrightarrow$ C1
   - Partner milte hi dono ko match room assign hota hai.

4. **20 to 30 Seconds (Expanded Compatible Range)**:
   - Server mobile client ko notify karta hai: `"range_expanded"`.
   - Compatible range allow hoti hai.

5. **30 Seconds (Timeout)**:
   - Agar 30s tak koi match nahi mila, user queue se safely remove hota hai aur client ko `"no_match"` bhejta hai taaki user Retry ya Cancel kar sake.

---

## 🎙️ 5. WebRTC Signaling Gateway (Socket.IO)

Socket.IO sirf signaling metadata handle karta hai:

| Socket Event | Direction | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `call.join` | Client $\rightarrow$ Server | `{ callId, token }` | User authorized call room join karta hai |
| `call.peer_ready` | Server $\rightarrow$ Client | `{ peerId, role }` | Batata hai kaun Offer bhejega aur kaun Answer |
| `webrtc.signal` | Peer A $\leftrightarrow$ Peer B | `{ sdp, type: 'offer'\|'answer' }` | WebRTC session description exchange |
| `webrtc.ice_candidate` | Peer A $\leftrightarrow$ Peer B | `{ candidate }` | NAT traversal network path exchange |
| `call.peer_mute_state` | Peer A $\rightarrow$ Peer B | `{ isMuted: boolean }` | Mic state sync (Waveform indicator ke liye) |
| `call.end` | Client $\rightarrow$ Server | `{ callId }` | Call end trigger aur room teardown |

---

## 📋 6. Step-by-Step Implementation Roadmap

Backend ko hum structured tarike se in 7 phases mein build karenge:

### 🔹 Step 1: NestJS Foundation & Environment Setup
- `server/` directory create karna.
- NestJS application initialize karna (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`).
- Environment configuration (`.env.example`, `ConfigModule`).

### 🔹 Step 2: Database & Prisma Setup
- Prisma ORM install karna.
- PostgreSQL schema create karna (`prisma/schema.prisma`).
- Neon / Local PostgreSQL connection string setup aur migrations run karna.
- Seed script: 8 curated assessment questions database mein pre-populate karna.

### 🔹 Step 3: Authentication & Security Guard
- Firebase Admin SDK configuration.
- `FirebaseAuthGuard` banana jo incoming `Authorization: Bearer <token>` ko verify kare.
- Current user decorator (`@CurrentUser()`).
- User profile sync (Firebase UID $\rightarrow$ PostgreSQL User).

### 🔹 Step 4: Assessment Module & Anti-Cheat Engine
- `GET /assessment/questions`: Client ko questions bhejega (bina correct answer ke!).
- `POST /assessment/submit`: Client answers bhejega; server score evaluate karke B1/B2/C1 CEFR level assign karega aur user status `APPROVED` karega.

### 🔹 Step 5: Redis Matchmaking Queue & Worker
- Redis client configuration (Upstash / Local Redis).
- Queue service: Join queue, cancel queue, active presence heartbeat.
- Matchmaking matching loop (0-10s exact, 10-20s adjacent, 20-30s wider range).

### 🔹 Step 6: Socket.IO Gateway & WebRTC Signaling
- `CallGateway` banana (`@WebSocketGateway`).
- Room authorization: Verify karna ki socket user usi call room ka participant hai.
- SDP Offer/Answer relay aur ICE candidate relay logic.

### 🔹 Step 7: Call History, Feedback & Safety Moderation
- `POST /calls/:id/feedback`: 5-star rating aur flow quality save karna, total minutes update karna.
- `POST /safety/report`: Inappropriate user ko report karna.
- `POST /safety/block`: Future matchmaking mein block kiye gaye users ko match na hone dena.

---

## 🎯 Ab Aage Kya Karna Hai?

Aap is plan ko dhyan se check kar lijiye.
Jab aap bolein:
1. Hum pehle **Step 1 & Step 2** se shuru karenge:
   - `server/` folder setup karenge
   - NestJS aur Prisma configure karenge
   - PostgreSQL schema migrate karenge
2. Har step par main aapse pooch kar chalunga — **kuch bhi bina puche automatic execute nahi hoga**!

Aap bataiye, kya hum Step 1 (NestJS foundation & Prisma setup) shuru karein ya plan mein koi specific badlav chahte hain?
