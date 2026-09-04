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

  joinRoom(roomName: string, userId: string, username: string, onCallReady?: (data: any) => void) {
    const socket = this.connect();
    this.currentRoom = roomName;

    socket.emit('join-room', { roomName, userId, username });

    if (onCallReady) {
      socket.off('call-ready');
      socket.on('call-ready', (data) => {
        console.log('🎙️ Received call-ready event:', data);
        onCallReady(data);
      });
    }
  }

  onPartnerMuteStatus(callback: (data: { isMuted: boolean; userId: string }) => void) {
    if (this.socket) {
      this.socket.off('partner-mute-status');
      this.socket.on('partner-mute-status', callback);
    }
  }

  onCallEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('call-ended');
      this.socket.on('call-ended', callback);
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const callSocketService = new CallSocketService();
