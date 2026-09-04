// ========================================================
// FluentUp - Safety & Moderation Controller
// ========================================================
// Routes:
// 1. POST   /api/safety/report              - Report an abusive learner
// 2. POST   /api/safety/block               - Block a learner from future matchmaking
// 3. DELETE /api/safety/unblock/:targetId   - Unblock a learner
// 4. GET    /api/safety/blocked             - Get list of blocked users
// ========================================================

import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { BlockUserDto, ReportUserDto } from './dto/safety.dto';
import { SafetyService } from './safety.service';

@Controller('safety')
@UseGuards(FirebaseAuthGuard) // Sabhi safety routes protected hone chahiye
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  /**
   * POST /api/safety/report
   * Report inappropriate conduct or offensive behavior.
   */
  @Post('report')
  report(@CurrentUser() user: User, @Body() dto: ReportUserDto) {
    return this.safetyService.reportUser(user.id, dto);
  }

  /**
   * POST /api/safety/block
   * Block partner so they never appear in radar again.
   */
  @Post('block')
  block(@CurrentUser() user: User, @Body() dto: BlockUserDto) {
    return this.safetyService.blockUser(user.id, dto);
  }

  /**
   * DELETE /api/safety/unblock/:targetUserId
   * Remove partner from block list.
   */
  @Delete('unblock/:targetUserId')
  unblock(@CurrentUser() user: User, @Param('targetUserId') targetUserId: string) {
    return this.safetyService.unblockUser(user.id, targetUserId);
  }

  /**
   * GET /api/safety/blocked
   * List blocked users.
   */
  @Get('blocked')
  getBlockedList(@CurrentUser() user: User) {
    return this.safetyService.getBlockedList(user.id);
  }
}
