// ========================================================
// FluentUp - Real-time Audio Signaling & Socket Client
// ========================================================
// Yeh client NestJS CallsGateway se WebSockets ke through connect hota hai:
// 1. Room join karna
// 2. Both peers ready signaling
// 3. Live mute/unmute state exchange
// 4. Partner leave/call-ended notification
// ========================================================

import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from '../constants/config';

class CallSocketService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;

  connect(): Socket {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(WS_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('🟢 Connected to FluentUp Call Signaling Gateway:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔴 Disconnected from Call Gateway:', reason);
      });
    }
    return this.socket;
  }

  joinRoom(
    roomName: string,
    userId: string,
    username: string,
    userProfile?: any,
    onCallReady?: (data: any) => void,
  ) {
    const socket = this.connect();
    this.currentRoom = roomName;

    socket.emit('join-room', { roomName, userId, username, userProfile });

    if (onCallReady) {
      socket.off('call-ready');
      socket.on('call-ready', (data) => {
        console.log('🎙️ Received call-ready event:', data);
        onCallReady(data);
      });
    }
  }

  onPartnerProfile(callback: (profile: any) => void) {
    if (this.socket) {
      this.socket.off('partner-profile');
      this.socket.on('partner-profile', (data) => {
        console.log('👤 [Socket] partner-profile received:', data);
        callback(data);
      });
    }
  }

  syncProfile(roomName: string, userProfile: any) {
    if (this.socket) {
      this.socket.emit('sync-profile', { roomName, userProfile });
    }
  }

  onPartnerMuteStatus(callback: (data: { isMuted: boolean; userId: string }) => void) {
    if (this.socket) {
      this.socket.off('partner-mute-status');
      this.socket.on('partner-mute-status', callback);
    }
  }

  onPartnerVideoStatus(callback: (data: { isVideoEnabled: boolean; userId: string }) => void) {
    if (this.socket) {
      this.socket.off('partner-video-status');
      this.socket.on('partner-video-status', callback);
    }
  }

  toggleVideo(roomName: string, isVideoEnabled: boolean, userId: string) {
    if (this.socket) {
      this.socket.emit('video-toggle', { roomName, isVideoEnabled, userId });
    }
  }

  onCallEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('call-ended');
      this.socket.on('call-ended', (data) => {
        console.log('🛑 [Socket] call-ended event received from server:', data);
        callback(data);
      });
    }
  }

  onPartnerDisconnected(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('partner-disconnected');
      this.socket.on('partner-disconnected', (data) => {
        console.log('⚠️ [Socket] partner-disconnected event received from server:', data);
        callback(data);
      });
    }
  }

  // ==========================================
  // WebRTC P2P Signaling Methods
  // ==========================================
  sendOffer(roomName: string, sdp: any) {
    if (this.socket) {
      this.socket.emit('offer', { roomName, sdp });
    }
  }

  onOffer(callback: (data: { sdp: any }) => void) {
    if (this.socket) {
      this.socket.off('offer');
      this.socket.on('offer', callback);
    }
  }

  sendAnswer(roomName: string, sdp: any) {
    if (this.socket) {
      this.socket.emit('answer', { roomName, sdp });
    }
  }

  onAnswer(callback: (data: { sdp: any }) => void) {
    if (this.socket) {
      this.socket.off('answer');
      this.socket.on('answer', callback);
    }
  }

  sendIceCandidate(roomName: string, candidate: any) {
    if (this.socket) {
      this.socket.emit('ice-candidate', { roomName, candidate });
    }
  }

  onIceCandidate(callback: (data: { candidate: any }) => void) {
    if (this.socket) {
      this.socket.off('ice-candidate');
      this.socket.on('ice-candidate', callback);
    }
  }

  toggleMute(isMuted: boolean, userId: string) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('mute-toggle', {
        roomName: this.currentRoom,
        isMuted,
        userId,
      });
    }
  }

  sendHeartbeat(roomName: string, userId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('heartbeat', { roomName, userId, timestamp: Date.now() });
    }
  }

  leaveRoom(userId: string, durationSec: number) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('leave-room', {
        roomName: this.currentRoom,
        userId,
        durationSec,
      });
      this.currentRoom = null;
    }
  }

  // ==========================================
  // Direct Friend Calling Methods
  // ==========================================
  registerUser(userId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('register-user', { userId });
    }
  }

  sendDirectCallInvite(
    targetUserId: string,
    roomName: string,
    mode: 'audio' | 'video',
    caller: { id: string; name: string; photoUrl?: string; level?: string },
  ) {
    if (this.socket) {
      this.socket.emit('direct-call-invite', {
        targetUserId,
        roomName,
        mode,
        caller,
      });
    }
  }

  onIncomingDirectCall(callback: (data: {
    caller: { id: string; name: string; photoUrl?: string; level?: string };
    roomName: string;
    mode: 'audio' | 'video';
    callerSocketId: string;
  }) => void) {
    if (this.socket) {
      this.socket.off('incoming-direct-call');
      this.socket.on('incoming-direct-call', callback);
    }
  }

  respondDirectCall(
    callerSocketId: string,
    accepted: boolean,
    roomName: string,
    responder: { id: string; name: string; photoUrl?: string; level?: string },
  ) {
    if (this.socket) {
      this.socket.emit('direct-call-response', {
        callerSocketId,
        accepted,
        roomName,
        responder,
      });
    }
  }

  onDirectCallAccepted(callback: (data: { roomName: string; responder: any }) => void) {
    if (this.socket) {
      this.socket.off('direct-call-accepted');
      this.socket.on('direct-call-accepted', callback);
    }
  }

  onDirectCallDeclined(callback: (data: { reason: string }) => void) {
    if (this.socket) {
      this.socket.off('direct-call-declined');
      this.socket.on('direct-call-declined', callback);
    }
  }

  onDirectCallFailed(callback: (data: { reason: string }) => void) {
    if (this.socket) {
      this.socket.off('direct-call-failed');
      this.socket.on('direct-call-failed', callback);
    }
  }

  cancelDirectCall(targetUserId: string) {
    if (this.socket) {
      this.socket.emit('direct-call-cancel', { targetUserId });
    }
  }

  onDirectCallCancelled(callback: () => void) {
    if (this.socket) {
      this.socket.off('direct-call-cancelled');
      this.socket.on('direct-call-cancelled', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const callSocketService = new CallSocketService();
