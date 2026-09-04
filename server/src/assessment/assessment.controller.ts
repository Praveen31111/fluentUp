// ========================================================
// FluentUp - Assessment Controller
// ========================================================
// Routes:
// 1. GET  /api/assessment/questions - Diagnostic test questions (anti-cheat)
// 2. POST /api/assessment/submit    - Answer evaluation & CEFR level assignment
// ========================================================

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  /**
   * GET /api/assessment/questions
   * --------------------------------------------------------
   * Mobile app ko diagnostic questions provide karta hai.
   * Correct answers server par hi safe rehte hain.
   */
  @Get('questions')
  getQuestions() {
    return this.assessmentService.getPublicQuestions();
  }

  /**
   * POST /api/assessment/submit
   * --------------------------------------------------------
   * User ke submitted answers ko evaluate karke score aur CEFR level
   * assign karta hai. Protected route (FirebaseAuthGuard required).
   */
  @Post('submit')
  @UseGuards(FirebaseAuthGuard)
  submit(
    @CurrentUser() user: User,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.assessmentService.evaluateAssessment(user.id, dto);
  }
}
