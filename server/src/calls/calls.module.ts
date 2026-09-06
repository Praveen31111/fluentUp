// ========================================================
// FluentUp - Calls Module
// ========================================================
// CallsGateway, CallsService, aur CallsController ko encapsulate karta hai.
// ========================================================

import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { CallsController } from './calls.controller';
import { CallsGateway } from './calls.gateway';
import { CallsService } from './calls.service';

@Module({
  imports: [AuthModule, forwardRef(() => MatchmakingModule)],
  controllers: [CallsController],
  providers: [CallsService, CallsGateway],
  exports: [CallsService, CallsGateway],
})
export class CallsModule {}
