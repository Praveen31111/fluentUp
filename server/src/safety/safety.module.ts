// ========================================================
// FluentUp - Safety Module
// ========================================================
// SafetyController aur SafetyService ko encapsulate karta hai
// aur SafetyService ko export karta hai taaki MatchmakingModule
// block filter use kar sake.
// ========================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  imports: [AuthModule],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
