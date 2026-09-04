// ========================================================
// FluentUp - Assessment Submission Data Transfer Objects (DTO)
// ========================================================
// Yeh types client se aane wale assessment submission payload
// ke format aur structure ko define karte hain.
// ========================================================

// Har ek submitted answer ka shape
export interface SubmittedAnswerItem {
  questionId: number;   // Question ka unique ID (database primary key)
  selectedIndex: number; // User dwara select kiya gaya option index (0, 1, ya 2)
}

// Poore submission request ka payload
export interface SubmitAssessmentDto {
  answers: SubmittedAnswerItem[]; // Saare 8 questions ke submitted answers ka array
}

// Server evaluation response ka structure
export interface AssessmentResultResponse {
  passed: boolean;              // true agar score >= 50% (B1/B2/C1), false agar beginner
  score: number;               // Percentage score (0 - 100%)
  correctCount: number;        // Kitne questions sahi hue (e.g. 7/8)
  totalQuestions: number;      // Total questions count (8)
  assignedLevel: string;       // CEFR Level: A2, B1, B2, C1
  approvalStatus: string;      // APPROVED ya REJECTED
  message: string;             // User ko dikhane wala friendly message
}
