// ========================================================
// FluentUp - Assessment Service & Anti-Cheat Engine
// ========================================================
// Yeh service do core functions provide karti hai:
// 1. getPublicQuestions: Questions ko bina correctIndex ke safe return karna.
// 2. evaluateAssessment: Server-side secure score evaluation, CEFR calculation,
//    aur Neon DB mein attempt history + user approval update karna.
// ========================================================

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, FluencyLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentResultResponse, SubmitAssessmentDto } from './dto/submit-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Public Questions Fetcher (Anti-Cheat)
   * --------------------------------------------------------
   * Database se questions nikaal kar client ko bhejta hai,
   * LEKIN "correctIndex" field ko exclude kar deta hai taaki
   * koi bhi user network tab ya code inspect karke answer na dekh sake.
   */
  async getPublicQuestions() {
    // Database se sirf active questions fetch karna
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { isActive: true },
      select: {
        id: true,          // Question ID
        category: true,    // E.g. "Polite Disagreement", "Phrasal Verbs"
        prompt: true,      // Question title / sentence
        instruction: true, // Guidance instruction
        options: true,     // 3 natural options (string array)
        difficulty: true,  // B1, B2, C1
        // DHYAN DEIN: correctIndex ko janboojh kar SELECT NAHI kiya gaya hai!
      },
      orderBy: { id: 'asc' }, // Order by ID 1 se 8
    });

    return questions;
  }

  /**
   * 2. Server-Side Assessment Evaluation
   * --------------------------------------------------------
   * Client se aane wale user answers ko database ke real answers se
   * match karke score calculate karta hai aur CEFR Level assign karta hai.
   */
  async evaluateAssessment(
    userId: string,
    dto: SubmitAssessmentDto,
  ): Promise<AssessmentResultResponse> {
    // Validation: Answers array empty nahi hona chahiye
    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException('Answers array cannot be empty');
    }

    // Database se user verify karna
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found in database');
    }

    // Database se sabhi active questions unke secret "correctIndex" ke saath fetch karna
    const officialQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { isActive: true },
      select: {
        id: true,
        correctIndex: true,
        difficulty: true,
      },
    });

    const totalQuestions = officialQuestions.length;
    if (totalQuestions === 0) {
      throw new BadRequestException('No assessment questions found in database');
    }

    // Fast O(1) lookup ke liye Map banana
    const answerKeyMap = new Map<number, number>();
    for (const q of officialQuestions) {
      answerKeyMap.set(q.id, q.correctIndex);
    }

    // Har answer ko check karna aur correct count calculate karna
    let correctCount = 0;
    for (const submitted of dto.answers) {
      const correctIdx = answerKeyMap.get(submitted.questionId);
      // Agar submitted index sahi hai
      if (correctIdx !== undefined && submitted.selectedIndex === correctIdx) {
        correctCount++;
      }
    }

    // Percentage score nikaalna (0 se 100%)
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // CEFR Level aur Approval Status calculate karna
    let assignedLevel: FluencyLevel;
    let approvalStatus: ApprovalStatus;
    let passed = false;
    let message = '';

    if (scorePercentage >= 87) {
      // 8 out of 8 sahi (>= 87%)
      assignedLevel = FluencyLevel.C1;
      approvalStatus = ApprovalStatus.APPROVED;
      passed = true;
      message = 'Exceptional fluency! You have been placed in Advanced C1.';
    } else if (scorePercentage >= 62) {
      // 6 ya 7 out of 8 sahi (>= 62%)
      assignedLevel = FluencyLevel.B2;
      approvalStatus = ApprovalStatus.APPROVED;
      passed = true;
      message = 'Great conversational skills! You have been placed in Upper-Intermediate B2.';
    } else if (scorePercentage >= 50) {
      // 4 ya 5 out of 8 sahi (>= 50%)
      assignedLevel = FluencyLevel.B1;
      approvalStatus = ApprovalStatus.APPROVED;
      passed = true;
      message = 'Good foundation! You have been placed in Intermediate B1.';
    } else {
      // 3 ya usse kam sahi (< 50%) -> Beginner level reject
      assignedLevel = FluencyLevel.A2;
      approvalStatus = ApprovalStatus.REJECTED;
      passed = false;
      message = 'FluentUp is tailored for intermediate and advanced speakers. Please practice fundamentals and try again.';
    }

    // 1. Assessment Attempt history record Neon database mein create karna
    await this.prisma.assessmentAttempt.create({
      data: {
        userId: user.id,
        score: scorePercentage,
        assignedLevel,
        passed,
        answersJson: dto.answers as any, // submitted answers ka snapshot
      },
    });

    // 2. User profile ko update karna (CEFR level aur approval status)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        level: assignedLevel,
        assessmentScore: scorePercentage,
        approvalStatus,
      },
    });

    // Final result response return karna
    return {
      passed,
      score: scorePercentage,
      correctCount,
      totalQuestions,
      assignedLevel: assignedLevel.toString(),
      approvalStatus: approvalStatus.toString(),
      message,
    };
  }
}
