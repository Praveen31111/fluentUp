// ========================================================
// FluentUp - Safety & Moderation DTOs
// ========================================================
// Report aur Block requests ke data shapes
// ========================================================

export interface ReportUserDto {
  targetUserId: string; // Jis user ko report kiya ja raha hai
  reason: string;       // Inappropriate language, harassment, spam, etc.
  callId?: string;      // Related call session ID (optional)
}

export interface BlockUserDto {
  targetUserId: string; // Jis partner ko block karna hai
}
