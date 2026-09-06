/**
 * FluentUp - Central Application State & Data Engine (Connected to Live Backend)
 * 
 * Yeh file poore app ka state (User, Auth, Assessment, Matchmaking, Audio Call, Feedback)
 * manage karti hai aur Backend APIs (NestJS + Neon PostgreSQL + Upstash Redis) se
 * seamless communication banati hai, saath hi offline fallback bhi rakhti hai.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssessmentApi, AuthApi, CallsApi, MatchmakingApi } from '../services/api';
import { callSocketService } from '../services/socket';
import { detectAudioDevices } from '../services/audioDevice';

// CEFR Fluency Levels
export type FluencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// User Approval Status (Beginners are guided to keep practicing, Intermediate/Advanced are Approved)
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// User Model Interface
export interface UserProfile {
  id: string;                       // Unique user ID
  email: string;                    // User email address
  username: string;                 // Display name (jaise: Praveen Kumar)
  level: FluencyLevel;              // Evaluated CEFR Level (B1, B2, C1, etc.)
  assessmentScore: number;          // Assessment percentage (0 - 100)
  status: ApprovalStatus;           // Status: APPROVED to enter home & practice
  isEmailVerified: boolean;         // Email verification flag
  totalSessions: number;            // Total completed oral speaking sessions
  totalMinutes: number;             // Total spoken minutes
  topTopic: string;                 // Most spoken conversation category
  address?: string;                 // Student city / location (e.g. New Delhi, India)
  education?: string;               // Student college / degree (e.g. B.Tech Computer Science)
  hobbies?: string[];               // Student hobbies (e.g. ["Cricket", "Coding", "Music"])
  bio?: string;                     // Short bio
  photoUrl?: string;                // Photo URI (saved locally on device, not in database!)
}

// Assessment Question Model
export interface AssessmentQuestion {
  id: number;                       // Question sequence ID (1 to 8)
  category: string;                 // Question category (Grammar, Idiomatic, Nuance, etc.)
  prompt: string;                   // Question title / context
  instruction: string;              // Helpful guidance text
  options: string[];                // 3 selectable natural sentence options
  correctIndex?: number;            // Optional server-only index
}

// Speaking Partner Profile in Call
export interface SpeakingPartner {
  id: string;
  name: string;
  level: string;
  location: string;
  avatar: string;
  sharedTopic: string;
  roomName?: string;
  callId?: string;
  durationInCall: number;
  address?: string;                 // Partner's city / location
  education?: string;               // Partner's college / education
  hobbies?: string[];               // Partner's hobbies list
}

// Full Context Type Definition
interface AppContextType {
  // User & Auth State
  user: UserProfile | null;
  authToken: string;
  isAuthenticated: boolean;
  loginUser: (email: string) => Promise<void>;
  signupUser: (email: string) => Promise<void>;
  verifyEmail: () => void;
  logoutUser: () => void;
  updateUserProfile: (data: {
    username?: string;
    address?: string;
    education?: string;
    hobbies?: string[];
    bio?: string;
    photoUrl?: string;
  }) => Promise<boolean>;

  // Assessment Gate Engine
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: number[];
  selectAnswer: (questionIndex: number, optionIndex: number) => void;
  nextQuestion: () => boolean;      // returns true agar assessment finish ho gaya
  submitAssessment: () => Promise<{ passed: boolean; level: FluencyLevel; score: number }>;
  resetAssessment: () => void;

  // Session Loading State
  isLoadingSession: boolean;

  // Active Persona (Optional backwards compatibility)
  currentPersona?: 'praveen' | 'rahul' | 'priya';
  switchPersona?: (persona: 'praveen' | 'rahul' | 'priya') => Promise<void>;

  // Matchmaking Queue Engine
  isMatchmaking: boolean;
  matchmakingTime: number;          // 0 to 30 seconds timer
  matchmakingRangeExpanded: boolean;// 20s ke baad expanded notice
  startMatchmaking: () => void;
  cancelMatchmaking: () => void;

  // Active Audio Call Engine
  activePartner: SpeakingPartner | null;
  callDuration: number;             // Elapsed call time in seconds
  isMuted: boolean;
  isSpeakerOn: boolean;
  audioRoute: 'speaker' | 'earpiece' | 'bluetooth';
  hasHeadsetConnected: boolean;
  headsetName: string | null;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  setAudioRoute: (route: 'speaker' | 'earpiece' | 'bluetooth') => void;
  cycleAudioRoute: () => void;
  endCall: () => void;

  // Post-Session Feedback
  saveFeedback: (rating: number, quality: string) => void;
}

// Default Fallback Questions
const FALLBACK_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    category: 'Idiomatic Precision',
    prompt: 'Choose the sentence that sounds natural in English.',
    instruction: 'Pick the phrasing native speakers use instinctively in daily conversation.',
    options: [
      'I have lived here for two years.',
      'I am living here since two years.',
      'I live here since two years.',
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    category: 'Polite Disagreement',
    prompt: 'What would you say when you disagree politely in a conversation?',
    instruction: 'Choose the response that is constructive, calm, and respectful.',
    options: [
      "You're completely wrong about that.",
      'I see your point, but I look at it a bit differently.',
      'No, that makes no sense to me.',
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    category: 'Sentence Completion',
    prompt: 'Complete the sentence naturally:',
    instruction: '"If I had known you were in town, I _______ you for coffee."',
    options: [
      'would have met',
      'will meet',
      'would meet',
    ],
    correctIndex: 0,
  },
  {
    id: 4,
    category: 'Phrasal Verbs in Context',
    prompt: 'Choose the natural way to say someone cancelled an appointment:',
    instruction: 'Select the idiomatic phrasal verb used in spoken English.',
    options: [
      'They called off the meeting.',
      'They put away the meeting.',
      'They brought down the meeting.',
    ],
    correctIndex: 0,
  },
  {
    id: 5,
    category: 'Conversational Nuance',
    prompt: 'How would you naturally ask someone to clarify a fast sentence?',
    instruction: 'Pick the casual yet polite spoken phrasing.',
    options: [
      'Repeat again now.',
      'What? Say that words.',
      'Could you say that once more? I missed the last part.',
    ],
    correctIndex: 2,
  },
  {
    id: 6,
    category: 'Spoken Vocabulary',
    prompt: 'Choose the sentence that expresses high likelihood:',
    instruction: 'Which modal structure sounds most native?',
    options: [
      'He is bound to arrive shortly.',
      'He maybe must arrive shortly.',
      'He certainly can to arrive shortly.',
    ],
    correctIndex: 0,
  },
  {
    id: 7,
    category: 'Expressing Opinions',
    prompt: 'How would you introduce a nuanced personal perspective?',
    instruction: 'Choose the professional and fluent introductory phrase.',
    options: [
      'In my experience, striking a balance is key.',
      'From my view, it is must balanced.',
      'According to me, everything is balance.',
    ],
    correctIndex: 0,
  },
  {
    id: 8,
    category: 'Natural Rhythm & Flow',
    prompt: 'Choose the sentence with proper preposition & gerund usage:',
    instruction: 'Which sentence has natural grammatical rhythm?',
    options: [
      'I look forward to speaking with you today.',
      'I look forward to speak with you today.',
      'I am looking forward for speak with you today.',
    ],
    correctIndex: 0,
  },
];

// Context creation
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Session Loading & Auth State (Starts null so real user goes through auth or restores session)
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [authToken, setAuthToken] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Optional backwards compatibility placeholder
  const [currentPersona, setCurrentPersona] = useState<'praveen' | 'rahul' | 'priya'>('praveen');
  const switchPersona = async (persona: 'praveen' | 'rahul' | 'priya') => {
    setCurrentPersona(persona);
  };

  // 2. Assessment State
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(FALLBACK_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  // 3. Matchmaking State
  const [isMatchmaking, setIsMatchmaking] = useState<boolean>(false);
  const [matchmakingTime, setMatchmakingTime] = useState<number>(0);
  const [matchmakingRangeExpanded, setMatchmakingRangeExpanded] = useState<boolean>(false);

  // 4. Active Call State (Initially null - populated ONLY when a REAL partner matches!)
  const [activePartner, setActivePartner] = useState<SpeakingPartner | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  // App Mount: Restore saved real user session from device storage
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken = await AsyncStorage.getItem('fluentup_auth_token');
        const savedUserJson = await AsyncStorage.getItem('fluentup_user_profile');

        if (savedToken) {
          setAuthToken(savedToken);

          if (savedUserJson) {
            try {
              setUser(JSON.parse(savedUserJson));
            } catch (err) {
              console.warn('Failed to parse cached user profile:', err);
            }
          }

          // Fetch fresh updated profile from live backend server
          const remoteUser = await AuthApi.getMe(savedToken);
          if (remoteUser) {
            let localPhoto: string | null = null;
            try {
              localPhoto = await AsyncStorage.getItem('fluentup_user_local_photo');
            } catch (e) {}

            const freshProfile: UserProfile = {
              id: remoteUser.id,
              email: remoteUser.email,
              username: remoteUser.username || remoteUser.email.split('@')[0] || 'Learner',
              level: (remoteUser.level || 'B2') as FluencyLevel,
              assessmentScore: remoteUser.assessmentScore || 0,
              status: (remoteUser.approvalStatus || 'APPROVED') as ApprovalStatus,
              isEmailVerified: true,
              totalSessions: remoteUser.totalSessions || 0,
              totalMinutes: remoteUser.totalMinutes || 0,
              topTopic: remoteUser.topTopic || 'Everyday English',
              address: remoteUser.address || '',
              education: remoteUser.education || '',
              hobbies: (remoteUser.hobbies && remoteUser.hobbies.length > 0) ? remoteUser.hobbies : ['English Practice', 'Traveling'],
              bio: remoteUser.bio || 'Practicing conversational English.',
              photoUrl: localPhoto || remoteUser.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            };
            setUser(freshProfile);
            await AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(freshProfile));
          }
        }
      } catch (e) {
        console.warn('Failed to restore session:', e);
      } finally {
        setIsLoadingSession(false);
      }
    }
    restoreSession();
  }, []);

  // Profile Update Handler (Photo saved locally on phone, text details saved in Database)
  const updateUserProfile = async (data: {
    username?: string;
    address?: string;
    education?: string;
    hobbies?: string[];
    bio?: string;
    photoUrl?: string;
  }): Promise<boolean> => {
    try {
      // 1. Mobile se upload hui photo ko phone ki local storage mein cache karein
      if (data.photoUrl) {
        await AsyncStorage.setItem('fluentup_user_local_photo', data.photoUrl);
      }

      // 2. Neon PostgreSQL Database mein details aur photoUrl save karein (Live partner sync)
      await AuthApi.updateProfile(authToken, {
        username: data.username,
        address: data.address,
        education: data.education,
        hobbies: data.hobbies,
        bio: data.bio,
        photoUrl: data.photoUrl,
      });

      // 3. React context state ko instantly update karein aur AsyncStorage mein persist karein
      setUser((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          username: data.username !== undefined ? data.username : prev.username,
          address: data.address !== undefined ? data.address : prev.address,
          education: data.education !== undefined ? data.education : prev.education,
          hobbies: data.hobbies !== undefined ? data.hobbies : prev.hobbies,
          bio: data.bio !== undefined ? data.bio : prev.bio,
          photoUrl: data.photoUrl !== undefined ? data.photoUrl : prev.photoUrl,
        };
        AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      return true;
    } catch (e) {
      console.warn('Error updating profile:', e);
      return false;
    }
  };

  // App Mount: Fetch live questions from Neon DB
  useEffect(() => {
    async function loadServerQuestions() {
      const serverQuestions = await AssessmentApi.getQuestions();
      if (serverQuestions && serverQuestions.length > 0) {
        setQuestions(serverQuestions);
      }
    }
    loadServerQuestions();
  }, []);

  // Matchmaking Timer & Status Polling
  useEffect(() => {
    let timer: any = null;
    let pollTimer: any = null;

    if (isMatchmaking) {
      // 1. Visual timer increment
      timer = setInterval(() => {
        setMatchmakingTime((prev) => {
          const next = prev + 1;
          if (next >= 20) {
            setMatchmakingRangeExpanded(true);
          }
          return next;
        });
      }, 1000);

      // 2. Backend Redis status polling (Real Match Check)
      pollTimer = setInterval(async () => {
        const res = await MatchmakingApi.getStatus(authToken);
        if (res && res.status === 'MATCHED' && res.match) {
          setIsMatchmaking(false);

          const rawName = res.match.partner.name || 'Speaking Partner';
          const partnerDisplayName = rawName.startsWith('Learner ')
            ? rawName.replace('Learner ', '').charAt(0).toUpperCase() + rawName.replace('Learner ', '').slice(1)
            : rawName;

          const rawPhoto = res.match.partner.photoUrl;
          const isValidPhoto =
            rawPhoto &&
            (rawPhoto.startsWith('http://') ||
             rawPhoto.startsWith('https://') ||
             rawPhoto.startsWith('data:image/'));

          const partnerAvatar = isValidPhoto
            ? rawPhoto
            : (partnerDisplayName.toLowerCase().includes('rahul')
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
            : partnerDisplayName.toLowerCase().includes('priya')
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
            : partnerDisplayName.toLowerCase().includes('praveen')
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');

          const partnerLocation = res.match.partner.address || 'Live Online';
          const partnerEducation = res.match.partner.education || 'Undergraduate Student';
          const partnerHobbies = (res.match.partner.hobbies && res.match.partner.hobbies.length > 0)
            ? res.match.partner.hobbies
            : ['English Practice', 'Traveling', 'Podcasts'];

          const matchedPartner: SpeakingPartner = {
            id: res.match.partner.id,
            name: partnerDisplayName,
            level: `${res.match.partner.level || 'C1'} · Fluent`,
            location: partnerLocation,
            address: partnerLocation,
            education: partnerEducation,
            hobbies: partnerHobbies,
            avatar: partnerAvatar,
            sharedTopic: res.match.topic || 'Daily routines & natural flow',
            roomName: res.match.roomName,
            callId: res.match.callId,
            durationInCall: 0,
          };

          setActivePartner(matchedPartner);
          setCallDuration(0);

          // Connect WebSockets signaling room & broadcast real-time user profile for cross-device visibility
          if (user && res.match.roomName) {
            callSocketService.joinRoom(
              res.match.roomName,
              user.id,
              user.username,
              {
                id: user.id,
                name: user.username,
                username: user.username,
                photoUrl: user.photoUrl,
                avatar: user.photoUrl,
                address: user.address,
                education: user.education,
                hobbies: user.hobbies,
                bio: user.bio,
                level: user.level,
              },
              (readyData) => {
                console.log('Room call-ready event received:', readyData);
              },
            );

            // Listen for partner profile update right away
            callSocketService.onPartnerProfile((partnerData: any) => {
              if (partnerData) {
                console.log('👤 [AppContext] Live partner profile synced over socket:', partnerData?.name);
                setActivePartner((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    name: partnerData.name || partnerData.username || prev.name,
                    avatar: partnerData.photoUrl || partnerData.avatar || prev.avatar,
                    address: partnerData.address || prev.address,
                    location: partnerData.address || prev.location,
                    education: partnerData.education || prev.education,
                    hobbies:
                      partnerData.hobbies && partnerData.hobbies.length > 0
                        ? partnerData.hobbies
                        : prev.hobbies,
                    level: partnerData.level ? `${partnerData.level} · Fluent` : prev.level,
                  };
                });
              }
            });
          }
        }
      }, 1500);
    } else {
      setMatchmakingTime(0);
      setMatchmakingRangeExpanded(false);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isMatchmaking, authToken, user]);

  // Call duration counter
  useEffect(() => {
    let callTimer: any = null;
    if (activePartner) {
      callTimer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimer) clearInterval(callTimer);
    };
  }, [activePartner]);

  // Safe Token Formatter preserving real email across accounts
  const formatAuthToken = (email: string) => {
    const safeEmail = email.toLowerCase().trim().replace(/@/g, '__at__').replace(/[^a-zA-Z0-9_.]/g, '_');
    return `dev-token-${safeEmail}`;
  };

  // Auth: Login User with live server sync
  const loginUser = async (email: string) => {
    const token = formatAuthToken(email);
    setAuthToken(token);
    await AsyncStorage.setItem('fluentup_auth_token', token);

    const remoteUser = await AuthApi.getMe(token);
    if (remoteUser) {
      const loggedUser: UserProfile = {
        id: remoteUser.id,
        email: remoteUser.email,
        username: remoteUser.username || email.split('@')[0] || 'Learner',
        level: (remoteUser.level || 'B2') as FluencyLevel,
        assessmentScore: remoteUser.assessmentScore || 85,
        status: (remoteUser.approvalStatus || 'APPROVED') as ApprovalStatus,
        isEmailVerified: true,
        totalSessions: remoteUser.totalSessions || 0,
        totalMinutes: remoteUser.totalMinutes || 0,
        topTopic: remoteUser.topTopic || 'Daily Routines',
        address: remoteUser.address || '',
        education: remoteUser.education || '',
        hobbies: (remoteUser.hobbies && remoteUser.hobbies.length > 0) ? remoteUser.hobbies : ['English Practice'],
        bio: remoteUser.bio || '',
        photoUrl: remoteUser.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      };
      setUser(loggedUser);
      await AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(loggedUser));
    } else {
      const fallbackUser: UserProfile = {
        id: 'user_' + Date.now(),
        email,
        username: email.split('@')[0] || 'Learner',
        level: 'B2',
        assessmentScore: 85,
        status: 'APPROVED',
        isEmailVerified: true,
        totalSessions: 0,
        totalMinutes: 0,
        topTopic: 'Daily Routines & Urban Travel',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      };
      setUser(fallbackUser);
      await AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(fallbackUser));
    }
  };

  // Auth: Sign Up User (Direct account creation with immediate database registration)
  const signupUser = async (email: string) => {
    const token = formatAuthToken(email);
    setAuthToken(token);
    await AsyncStorage.setItem('fluentup_auth_token', token);

    // Call server immediately to create record in database
    const remoteUser = await AuthApi.getMe(token);
    if (remoteUser) {
      const newUser: UserProfile = {
        id: remoteUser.id,
        email: remoteUser.email,
        username: remoteUser.username || email.split('@')[0] || 'Learner',
        level: (remoteUser.level || 'B1') as FluencyLevel,
        assessmentScore: remoteUser.assessmentScore || 75,
        status: (remoteUser.approvalStatus || 'APPROVED') as ApprovalStatus,
        isEmailVerified: true,
        totalSessions: 0,
        totalMinutes: 0,
        topTopic: 'Everyday English & Conversations',
        photoUrl: remoteUser.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      };
      setUser(newUser);
      await AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(newUser));
    } else {
      const newUser: UserProfile = {
        id: 'user_' + Date.now(),
        email,
        username: email.split('@')[0] || 'Learner',
        level: 'B1',
        assessmentScore: 75,
        status: 'APPROVED',
        isEmailVerified: true,
        totalSessions: 0,
        totalMinutes: 0,
        topTopic: 'Everyday English & Conversations',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      };
      setUser(newUser);
      await AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(newUser));
    }
  };

  // Auth: Verify Email
  const verifyEmail = async () => {
    if (user) {
      const updated = { ...user, isEmailVerified: true };
      setUser(updated);
      try {
        await AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Auth: Logout User (Wipes tokens and cached profiles so switching accounts is 100% clean)
  const logoutUser = async () => {
    setUser(null);
    setAuthToken('');
    try {
      await AsyncStorage.removeItem('fluentup_auth_token');
      await AsyncStorage.removeItem('fluentup_user_profile');
      await AsyncStorage.removeItem('fluentup_user_local_photo');
    } catch (e) {
      console.warn('Failed to remove storage on logout:', e);
    }
  };

  // Assessment: Select Option
  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[questionIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  // Assessment: Next Question
  const nextQuestion = (): boolean => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return false;
    }
    return true;
  };

  // Assessment: Submit to Backend Server
  const submitAssessment = async (): Promise<{ passed: boolean; level: FluencyLevel; score: number }> => {
    const answersPayload = questions.map((q, idx) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[idx] ?? 0,
    }));

    // Server evaluation
    const serverResult = await AssessmentApi.submit(authToken, answersPayload);

    if (serverResult) {
      const assignedLevel = serverResult.assignedLevel as FluencyLevel;
      const passed = serverResult.passed;
      const score = serverResult.score;

      if (user) {
        const updated: UserProfile = {
          ...user,
          level: assignedLevel,
          assessmentScore: score,
          status: passed ? 'APPROVED' : 'REJECTED',
        };
        setUser(updated);
        AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(updated)).catch(() => {});
      }

      return { passed, level: assignedLevel, score };
    }

    // Local Fallback if server is not responding
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === (q.correctIndex ?? 0)) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const passed = scorePercentage >= 50;
    const assignedLevel: FluencyLevel = scorePercentage >= 85 ? 'C1' : scorePercentage >= 60 ? 'B2' : scorePercentage >= 50 ? 'B1' : 'A2';

    if (user) {
      const updated: UserProfile = {
        ...user,
        level: assignedLevel,
        assessmentScore: scorePercentage,
        status: passed ? 'APPROVED' : 'REJECTED',
      };
      setUser(updated);
      AsyncStorage.setItem('fluentup_user_profile', JSON.stringify(updated)).catch(() => {});
    }

    return { passed, level: assignedLevel, score: scorePercentage };
  };

  // Assessment: Reset
  const resetAssessment = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
  };

  // Matchmaking: Start
  const startMatchmaking = async () => {
    setActivePartner(null);
    setCallDuration(0);
    setIsMatchmaking(true);
    setMatchmakingTime(0);
    setMatchmakingRangeExpanded(false);

    // Call live server to enter queue
    await MatchmakingApi.join(authToken);
  };

  // Matchmaking: Cancel
  const cancelMatchmaking = async () => {
    setIsMatchmaking(false);
    setMatchmakingTime(0);
    setMatchmakingRangeExpanded(false);
    setActivePartner(null);

    // Call live server to remove from queue
    await MatchmakingApi.cancel(authToken);
  };

  // Audio Call: Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (user) {
      callSocketService.toggleMute(nextMuted, user.id);
    }
  };

  // Audio Call: Audio Route (Speaker, Bluetooth/Earphone, Earpiece)
  const [audioRoute, setAudioRouteState] = useState<'speaker' | 'earpiece' | 'bluetooth'>('speaker');
  const [hasHeadsetConnected, setHasHeadsetConnected] = useState<boolean>(false);
  const [headsetName, setHeadsetName] = useState<string | null>(null);

  // Live Hardware Audio Device Listener (checks for wired earphones & Bluetooth neckbands)
  useEffect(() => {
    let isMounted = true;

    const checkDevices = async () => {
      try {
        const status = await detectAudioDevices();
        if (isMounted) {
          setHasHeadsetConnected(status.hasHeadset);
          setHeadsetName(status.headsetName);

          // Agar user ne earphone/neckband plug ya connect kiya, toh automatically earphone route karein
          if (status.hasHeadset && audioRoute !== 'bluetooth' && audioRoute !== 'earpiece') {
            setAudioRouteState('bluetooth');
            setIsSpeakerOn(false);
          } else if (!status.hasHeadset && audioRoute === 'bluetooth') {
            // Disconnect hone par fallback to loudspeaker
            setAudioRouteState('speaker');
            setIsSpeakerOn(true);
          }
        }
      } catch (e) {}
    };

    checkDevices();
    const interval = setInterval(checkDevices, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [audioRoute]);

  const setAudioRoute = (route: 'speaker' | 'earpiece' | 'bluetooth') => {
    setAudioRouteState(route);
    setIsSpeakerOn(route === 'speaker');
  };

  const cycleAudioRoute = () => {
    setAudioRouteState((prev) => {
      let next: 'speaker' | 'earpiece' | 'bluetooth';
      if (hasHeadsetConnected) {
        // Earphone/Neckband connected hai -> Earphone -> Speaker -> Earpiece -> Earphone
        next = prev === 'bluetooth' ? 'speaker' : prev === 'speaker' ? 'earpiece' : 'bluetooth';
      } else {
        // Earphone connect nahi hai -> Sirf Speaker <-> Earpiece toggle
        next = prev === 'speaker' ? 'earpiece' : 'speaker';
      }
      setIsSpeakerOn(next === 'speaker');
      return next;
    });
  };

  // Audio Call: Toggle Speaker
  const toggleSpeaker = () => {
    cycleAudioRoute();
  };

  // Audio Call: End session
  const endCall = async () => {
    if (activePartner && activePartner.roomName) {
      if (user) {
        callSocketService.leaveRoom(user.id, callDuration);
      }
      // Backend ko call end notify karna
      await CallsApi.endCall(authToken, activePartner.roomName, callDuration);
    }
  };

  // Post-Session Feedback: Save rating
  const saveFeedback = async (rating: number, quality: string) => {
    if (activePartner && activePartner.callId) {
      await CallsApi.submitFeedback(authToken, activePartner.callId, rating, quality);
    }

    if (user) {
      const addedMinutes = Math.max(1, Math.round(callDuration / 60));
      setUser({
        ...user,
        totalSessions: user.totalSessions + 1,
        totalMinutes: user.totalMinutes + addedMinutes,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authToken,
        isLoadingSession,
        isAuthenticated: !!user,
        loginUser,
        signupUser,
        verifyEmail,
        logoutUser,
        updateUserProfile,

        currentPersona,
        switchPersona,

        questions,
        currentQuestionIndex,
        selectedAnswers,
        selectAnswer,
        nextQuestion,
        submitAssessment,
        resetAssessment,

        isMatchmaking,
        matchmakingTime,
        matchmakingRangeExpanded,
        startMatchmaking,
        cancelMatchmaking,

        activePartner,
        callDuration,
        isMuted,
        isSpeakerOn,
        audioRoute,
        hasHeadsetConnected,
        headsetName,
        toggleMute,
        toggleSpeaker,
        setAudioRoute,
        cycleAudioRoute,
        endCall,

        saveFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook to access FluentUp Context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
