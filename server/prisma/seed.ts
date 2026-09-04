/**
 * FluentUp - Database Seed Script
 * 
 * Yeh script PostgreSQL database mein initial 8 curated English fluency assessment questions
 * pre-populate karti hai.
 * 
 * Run karne ke liye: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient instance initialize kiya
const prisma = new PrismaClient();

// 8 Curated Spoken English Assessment Questions
const QUESTIONS = [
  {
    category: 'Idiomatic Precision',
    prompt: 'Choose the sentence that sounds natural in English.',
    instruction: 'Pick the phrasing native speakers use instinctively in daily conversation.',
    options: [
      'I have lived here for two years.',
      'I am living here since two years.',
      'I live here since two years.',
    ],
    correctIndex: 0,
    difficulty: 'B1',
  },
  {
    category: 'Polite Disagreement',
    prompt: 'What would you say when you disagree politely in a conversation?',
    instruction: 'Choose the response that is constructive, calm, and respectful.',
    options: [
      "You're completely wrong about that.",
      'I see your point, but I look at it a bit differently.',
      'No, that makes no sense to me.',
    ],
    correctIndex: 1,
    difficulty: 'B2',
  },
  {
    category: 'Sentence Completion',
    prompt: 'Complete the sentence naturally:',
    instruction: '"If I had known you were in town, I _______ you for coffee."',
    options: [
      'would have met',
      'will meet',
      'would meet',
    ],
    correctIndex: 0,
    difficulty: 'B2',
  },
  {
    category: 'Phrasal Verbs in Context',
    prompt: 'Choose the natural way to say someone cancelled an appointment:',
    instruction: 'Select the idiomatic phrasal verb used in spoken English.',
    options: [
      'They called off the meeting.',
      'They put away the meeting.',
      'They brought down the meeting.',
    ],
    correctIndex: 0,
    difficulty: 'B1',
  },
  {
    category: 'Conversational Nuance',
    prompt: 'How would you naturally ask someone to clarify a fast sentence?',
    instruction: 'Pick the casual yet polite spoken phrasing.',
    options: [
      'Repeat again now.',
      'What? Say that words.',
      'Could you say that once more? I missed the last part.',
    ],
    correctIndex: 2,
    difficulty: 'B2',
  },
  {
    category: 'Spoken Vocabulary',
    prompt: 'Choose the sentence that expresses high likelihood:',
    instruction: 'Which modal structure sounds most native?',
    options: [
      'He is bound to arrive shortly.',
      'He maybe must arrive shortly.',
      'He certainly can to arrive shortly.',
    ],
    correctIndex: 0,
    difficulty: 'C1',
  },
  {
    category: 'Expressing Opinions',
    prompt: 'How would you introduce a nuanced personal perspective?',
    instruction: 'Choose the professional and fluent introductory phrase.',
    options: [
      'In my experience, striking a balance is key.',
      'From my view, it is must balanced.',
      'According to me, everything is balance.',
    ],
    correctIndex: 0,
    difficulty: 'C1',
  },
  {
    category: 'Natural Rhythm & Flow',
    prompt: 'Choose the sentence with proper preposition & gerund usage:',
    instruction: 'Which sentence has natural grammatical rhythm?',
    options: [
      'I look forward to speaking with you today.',
      'I look forward to speak with you today.',
      'I am looking forward for speak with you today.',
    ],
    correctIndex: 0,
    difficulty: 'B2',
  },
];

async function main() {
  console.log('🌱 Seeding FluentUp Assessment Questions...');

  // Purane questions delete karke fresh seed karna taaki duplicates na banein
  await prisma.assessmentQuestion.deleteMany();

  // Sabhi questions ko database mein insert karna
  for (const q of QUESTIONS) {
    await prisma.assessmentQuestion.create({
      data: q,
    });
  }

  console.log(`✅ Successfully seeded ${QUESTIONS.length} assessment questions!`);
}

// Seed function run karna aur error handle karna
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Database connection safely close karna
    await prisma.$disconnect();
  });
