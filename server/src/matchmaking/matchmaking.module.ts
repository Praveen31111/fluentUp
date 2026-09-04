// ========================================================
// FluentUp - Matchmaking Module
// ========================================================
// MatchmakingController aur MatchmakingService ko encapsulate karta hai
// aur AuthModule ko import karta hai.
// ========================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SafetyModule } from '../safety/safety.module';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';

@Module({
  imports: [AuthModule, SafetyModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
