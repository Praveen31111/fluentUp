import { API_BASE_URL } from '@/constants/config';

export interface FriendUser {
  id: string;
  username: string;
  photoUrl?: string | null;
  level?: string;
  totalMinutes?: number;
  totalSessions?: number;
  topTopic?: string | null;
  address?: string | null;
  education?: string | null;
  hobbies?: string[];
}

export interface FriendItem {
  friendshipId: string;
  createdAt: string;
  friend: FriendUser;
}

export interface PendingRequestItem {
  requestId: string;
  createdAt: string;
  sender: FriendUser;
}

export class FriendsApi {
  /**
   * 1. Send Friend Request to Speaking Partner
   */
  static async sendRequest(
    token: string,
    targetUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request/${targetUserId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to send friend request.' };
      }
      return { success: true, message: 'Friend request sent successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error.' };
    }
  }

  /**
   * 2. Accept Incoming Friend Request
   */
  static async acceptRequest(
    token: string,
    friendshipId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/accept/${friendshipId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to accept request.' };
      }
      return { success: true, message: 'Friend request accepted!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error.' };
    }
  }

  /**
   * 3. Reject / Decline Friend Request
   */
  static async rejectRequest(
    token: string,
    friendshipId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/reject/${friendshipId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to decline request.' };
      }
      return { success: true, message: 'Friend request declined.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error.' };
    }
  }

  /**
   * 4. Fetch Accepted Friends List
   */
  static async getFriendsList(token: string): Promise<FriendItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 5. Fetch Pending Requests
   */
  static async getPendingRequests(token: string): Promise<PendingRequestItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 6. Remove a Friend
   */
  static async removeFriend(
    token: string,
    friendshipId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        return { success: true, message: 'Friend removed.' };
      }
      return { success: false, message: 'Failed to remove friend.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error.' };
    }
  }
}
