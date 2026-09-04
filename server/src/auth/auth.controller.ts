// ========================================================
// FluentUp - Auth Controller
// ========================================================
// Routes:
// 1. GET   /api/auth/me      - Current authenticated user profile
// 2. PATCH /api/auth/profile - Display name update
// ========================================================

import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /api/auth/me
   * Protected route: Client Firebase token bhejega, aur backend
   * Neon DB se user ka verified profile, level aur approval status return karega.
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getMe(@CurrentUser() user: User) {
    return this.authService.getProfile(user);
  }

  /**
   * PATCH /api/auth/profile
   * User apna profile details (username, address, education, hobbies, bio, photoUrl) update kar sakta hai.
   */
  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  updateProfile(
    @CurrentUser() user: User,
    @Body()
    dto: {
      username?: string;
      address?: string;
      education?: string;
      hobbies?: string[];
      bio?: string;
      photoUrl?: string;
    },
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
