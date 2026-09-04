// ========================================================
// FluentUp - Matchmaking Controller
// ========================================================
// Routes:
// 1. POST /api/matchmaking/join   - Join 30s matching radar
// 2. GET  /api/matchmaking/status - Poll matching radar status
// 3. POST /api/matchmaking/cancel - Cancel active search
// ========================================================

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
@UseGuards(FirebaseAuthGuard) // Saare matchmaking routes authenticated hone chahiye
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  /**
   * POST /api/matchmaking/join
   * User matching radar queue mein enter hota hai.
   */
  @Post('join')
  join(@CurrentUser() user: User) {
    return this.matchmakingService.joinQueue(user);
  }

  /**
   * GET /api/matchmaking/status
   * Mobile app har 1-2 second mein radar ka status check karti hai:
   * Returns QUEUED (with elapsed time), MATCHED (with room & partner), ya TIMEOUT.
   */
  @Get('status')
  getStatus(@CurrentUser() user: User) {
    return this.matchmakingService.getStatus(user.id);
  }

  /**
   * POST /api/matchmaking/cancel
   * User jab radar screen par "Cancel Search" dabata hai.
   */
  @Post('cancel')
  cancel(@CurrentUser() user: User) {
    return this.matchmakingService.cancelQueue(user.id);
  }
}
