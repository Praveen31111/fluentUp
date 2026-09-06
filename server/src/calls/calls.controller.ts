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
import { CallsGateway } from './calls.gateway';
import { SubmitFeedbackDto } from './dto/call-feedback.dto';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly callsGateway: CallsGateway,
  ) {}

  /**
   * GET /api/calls/ice-servers
   * Dynamic STUN/TURN configuration for mobile NAT traversal
   */
  @Get('ice-servers')
  getIceServers() {
    return this.callsService.getIceServers();
  }

  /**
   * GET /api/calls/history
   * Logged-in user ke purane completed practice sessions ki list.
   */
  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  getHistory(@CurrentUser() user: User) {
    return this.callsService.getUserHistory(user.id);
  }

  /**
   * POST /api/calls/:roomName/end
   * REST endpoint to end call session and credit practice minutes
   */
  @Post(':roomName/end')
  @UseGuards(FirebaseAuthGuard)
  async endCall(
    @Param('roomName') roomName: string,
    @CurrentUser() user: User,
    @Body('durationSeconds') durationSeconds?: number,
  ) {
    const summary = await this.callsService.endCallSession(roomName, user.id, durationSeconds);
    this.callsGateway.notifyCallEnded(roomName, user.id, summary);
    return summary;
  }

  /**
   * POST /api/calls/:id/feedback
   * Call khatam hone par 1 se 5 star rating submit karna.
   */
  @Post(':id/feedback')
  @UseGuards(FirebaseAuthGuard)
  submitFeedback(
    @Param('id') callId: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.callsService.submitFeedback(callId, user.id, dto);
  }
}
