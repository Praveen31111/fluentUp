// ========================================================
// FluentUp - Matchmaking Types & Conversation Topics
// ========================================================
// Yeh file matchmaking queue ke data structures aur
// 1-on-1 calls ke liye curated conversation topics define karti hai.
// ========================================================

import { FluencyLevel } from '@prisma/client';

// Queue mein store hone wala user data
export interface QueuedLearner {
  userId: string;          // Database user UUID
  username: string;        // Display name
  level: FluencyLevel;     // CEFR level (B1, B2, C1)
  joinedAt: number;        // Epoch timestamp (Date.now())
  photoUrl?: string | null;// Student photo / avatar
  address?: string | null; // Student city / location
  education?: string | null;// Student education / college
  hobbies?: string[];      // Student hobbies tags
}

// Successful match hone par return hone wala data
export interface MatchResult {
  callId: string;          // Neon DB calls table record ID
  roomName: string;        // Unique WebRTC audio room channel name
  topic: string;           // Conversation starter topic
  partner: {
    id: string;            // Partner user ID
    name: string;          // Partner display name
    level: string;         // Partner CEFR level
    photoUrl?: string | null;
    address?: string | null;
    education?: string | null;
    hobbies?: string[];
  };
}

// Curated 1-on-1 English Spoken Conversation Starters
// Awkward silence ko khatam karne ke liye automatically assign hote hain
export const CONVERSATION_TOPICS = [
  'Career Aspirations, Ambitions & Modern Workplace Culture',
  'Favorite Travel Journeys & Unforgettable Cultural Shocks',
  'The Real-World Impact of Artificial Intelligence & Daily Tech',
  'Daily Habits, Morning Routines & Personal Productivity Hacks',
  'Cinema, Storytelling & Books That Shaped Your Perspective',
  'Street Food, Culinary Adventures & International Cuisines',
  'City Life vs. Calm Countryside Living: Which Do You Prefer?',
  'Lifelong Learning, Hobbies & Mastering New Difficult Skills',
  'Sustainable Living, Climate Awareness & Future Cities',
  'The Art of Deep Friendships & Staying Connected Across Distances',
];
