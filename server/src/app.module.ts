/**
 * FluentUp - Root Application Module
 * 
 * NestJS application ka central dependency injection container.
 * Yahan ConfigModule (environment variables) aur future modules (Auth, Users, Assessment, Matchmaking, Calls) register honge.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AssessmentModule } from './assessment/assessment.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { CallsModule } from './calls/calls.module';
import { SafetyModule } from './safety/safety.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  // imports array: Third-party aur core feature modules ko load karta hai
  imports: [
    // ConfigModule.forRoot: .env file ko poore application ke liye globally available banata hai
    ConfigModule.forRoot({
      isGlobal: true, // Kisi bhi service mein ConfigService directly inject ki ja sakti hai
      envFilePath: '.env', // Target environment configuration file
    }),
    // PrismaModule: Global database client
    PrismaModule,
    // AuthModule: Firebase token verification & user profile management
    AuthModule,
    // AssessmentModule: Anti-cheat diagnostic test & CEFR engine
    AssessmentModule,
    // MatchmakingModule: Redis matchmaking queue & tiered engine
    MatchmakingModule,
    // CallsModule: WebRTC audio signaling gateway & call duration/feedback tracking
    CallsModule,
    // SafetyModule: User reporting, blocking, and abuse prevention
    SafetyModule,
  ],
  // controllers array: Incoming HTTP requests handle karne wale controllers
  controllers: [AppController],
  // providers array: Business logic provide karne wali services
  providers: [AppService],
})
export class AppModule {}
