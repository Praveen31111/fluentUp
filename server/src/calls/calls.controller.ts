// ========================================================
// FluentUp - Calls Controller
// ========================================================
// Routes:
// 1. GET  /api/calls/history        - User completed sessions history
// 2. POST /api/calls/:id/feedback   - Submit 5-star call feedback
// ========================================================

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CallsService } from './calls.service';
import { SubmitFeedbackDto } from './dto/call-feedback.dto';

@Controller('calls')
@UseGuards(FirebaseAuthGuard) // Saare call routes protected hone chahiye
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /**
   * GET /api/calls/history
   * Logged-in user ke purane completed practice sessions ki list.
   */
  @Get('history')
  getHistory(@CurrentUser() user: User) {
    return this.callsService.getUserHistory(user.id);
  }

  /**
   * POST /api/calls/:roomName/end
   * REST endpoint to end call session and credit practice minutes
   */
  @Post(':roomName/end')
  endCall(
    @Param('roomName') roomName: string,
    @CurrentUser() user: User,
    @Body('durationSeconds') durationSeconds?: number,
  ) {
    return this.callsService.endCallSession(roomName, user.id, durationSeconds);
  }

  /**
   * POST /api/calls/:id/feedback
   * Call khatam hone par 1 se 5 star rating submit karna.
   */
  @Post(':id/feedback')
  submitFeedback(
    @Param('id') callId: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.callsService.submitFeedback(callId, user.id, dto);
  }
}
