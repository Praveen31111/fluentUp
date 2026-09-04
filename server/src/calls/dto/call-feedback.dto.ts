// ========================================================
// FluentUp - Call Feedback & End Call DTOs
// ========================================================
// Call khatam hone par feedback aur ratings ke data structures
// ========================================================

export interface SubmitFeedbackDto {
  rating: number;       // 1 to 5 stars
  flowQuality: string;  // "great", "somewhat", "nomatch"
}

export interface CallSummaryResponse {
  callId: string;
  roomName: string;
  durationSeconds: number;
  durationMinutes: number;
  topic: string;
  partnerName: string;
  endedAt: Date;
}
