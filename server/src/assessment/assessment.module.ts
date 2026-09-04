// ========================================================
// FluentUp - Assessment Module
// ========================================================
// AssessmentController aur AssessmentService ko encapsulate karta hai
// aur AuthModule ko import karta hai taaki FirebaseAuthGuard accessible ho.
// ========================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';

@Module({
  imports: [AuthModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
