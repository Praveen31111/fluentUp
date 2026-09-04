// ========================================================
// FluentUp - Auth Module
// ========================================================
// Auth module FirebaseService, AuthService, aur FirebaseAuthGuard
// ko encapsulate karta hai aur export karta hai.
// ========================================================

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, FirebaseService, FirebaseAuthGuard],
  exports: [FirebaseService, FirebaseAuthGuard], // Dusre modules ke routes protect karne ke liye export
})
export class AuthModule {}
