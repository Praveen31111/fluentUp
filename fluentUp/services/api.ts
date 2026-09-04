// ========================================================
// FluentUp - Mobile API Client
// ========================================================
// Yeh service mobile frontend ko NestJS backend endpoints se connect
// karti hai (Auth, Assessment, Matchmaking, Calls, Safety).
// Agar server offline ho toh gracefully fallback handle karti hai.
// ========================================================

import { API_BASE_URL } from '../constants/config';

// Helper function to handle standard HTTP requests
async function fetchApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    token?: string;
    body?: any;
  } = {},
): Promise<T | null> {
  const { method = 'GET', token, body } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`API Error [${endpoint}]:`, errorData.message || response.statusText);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Network request failed for ${endpoint}:`, error);
    return null;
  }
}

// 1. Authentication APIs
export const AuthApi = {
  // Current user profile fetch karna
  getMe: async (token: string) => {
    return fetchApi<any>('/auth/me', { token });
  },

  // Profile update karna (address, education, hobbies, bio, username)
  updateProfile: async (
    token: string,
    data: {
      username?: string;
      address?: string;
      education?: string;
      hobbies?: string[];
      bio?: string;
      photoUrl?: string;
    },
  ) => {
    return fetchApi<any>('/auth/profile', {
      method: 'PATCH',
      token,
      body: data,
    });
  },
};

// 2. Assessment APIs
export const AssessmentApi = {
  // Neon DB se 8 diagnostic questions fetch karna (anti-cheat: correctIndex excluded)
  getQuestions: async () => {
    return fetchApi<any[]>('/assessment/questions');
  },

  // Answers submit karke CEFR level aur approval status lena
  submit: async (token: string, answers: { questionId: number; selectedIndex: number }[]) => {
    return fetchApi<any>('/assessment/submit', {
      method: 'POST',
      token,
      body: { answers },
    });
  },
};

// 3. Matchmaking Radar APIs
export const MatchmakingApi = {
  // 30s matching radar queue mein enter hona
  join: async (token: string) => {
    return fetchApi<any>('/matchmaking/join', {
      method: 'POST',
      token,
    });
  },

  // Radar status poll karna (QUEUED, MATCHED, TIMEOUT)
  getStatus: async (token: string) => {
    return fetchApi<any>('/matchmaking/status', { token });
  },

  // Search cancel karna
  cancel: async (token: string) => {
    return fetchApi<any>('/matchmaking/cancel', {
      method: 'POST',
      token,
    });
  },
};

// 4. Calls & Feedback APIs
export const CallsApi = {
  // Call end karna aur minutes credit karna
  endCall: async (token: string, roomName: string, durationSeconds?: number) => {
    return fetchApi<any>(`/calls/${roomName}/end`, {
      method: 'POST',
      token,
      body: { durationSeconds },
    });
  },

  // 1-to-5 star feedback submit karna
  submitFeedback: async (
    token: string,
    callId: string,
    rating: number,
    flowQuality: string,
  ) => {
    return fetchApi<any>(`/calls/${callId}/feedback`, {
      method: 'POST',
      token,
      body: { rating, flowQuality },
    });
  },

  // User ke purane practice calls ki history
  getHistory: async (token: string) => {
    return fetchApi<any[]>('/calls/history', { token });
  },
};

// 5. Safety & Moderation APIs
export const SafetyApi = {
  reportUser: async (token: string, targetUserId: string, reason: string, callId?: string) => {
    return fetchApi<any>('/safety/report', {
      method: 'POST',
      token,
      body: { targetUserId, reason, callId },
    });
  },

  blockUser: async (token: string, targetUserId: string) => {
    return fetchApi<any>('/safety/block', {
      method: 'POST',
      token,
      body: { targetUserId },
    });
  },

  unblockUser: async (token: string, targetUserId: string) => {
    return fetchApi<any>(`/safety/unblock/${targetUserId}`, {
      method: 'DELETE',
      token,
    });
  },

  getBlockedUsers: async (token: string) => {
    return fetchApi<any[]>('/safety/blocked', { token });
  },
};
