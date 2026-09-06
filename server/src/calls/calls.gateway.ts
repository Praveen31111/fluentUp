// ========================================================
// FluentUp - WebRTC Audio Signaling & Call Gateway
// ========================================================
// Yeh WebSocket Gateway do mobile clients ke beech real-time
// WebRTC audio connection establish karta hai:
// 1. join-room      - Room join karna & call-ready signal
// 2. offer / answer - SDP audio session exchange
// 3. ice-candidate  - Direct peer-to-peer audio connection
// 4. mute-toggle    - Mic status sync
// 5. leave-room     - Call end & session minutes credit
// ========================================================

import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CallsService } from './calls.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Mobile apps se aane wale connections allow karna
  },
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CallsGateway.name);

  // Active rooms tracking: roomName -> Set of socket IDs
  private roomParticipants = new Map<string, Set<string>>();

  // Socket ID -> { userId, roomName }
  private socketMeta = new Map<string, { userId: string; roomName: string }>();

  // Real-time live profile store per room: roomName -> (userId -> userProfile)
  private roomProfiles = new Map<string, Map<string, any>>();

  // Background app-switch & network handover grace period: key = `${roomName}:${userId}`
  private disconnectGraceTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private readonly callsService: CallsService) {}

  /**
   * Broadcast call ended to room participants from REST controller or internal service
   */
  notifyCallEnded(roomName: string, endedByUserId: string, summary: any) {
    this.logger.log(`📢 Broadcasting call-ended to room: ${roomName} (ended by ${endedByUserId})`);
    if (this.server) {
      this.server.to(roomName).emit('call-ended', {
        endedBy: endedByUserId,
        summary,
      });
    }
  }

  /**
   * Client connected
   */
  handleConnection(client: Socket) {
    this.logger.log(`🟢 Socket connected: ${client.id}`);
  }

  /**
   * Client disconnected (e.g. backgrounding, app switch, temporary network fluctuation)
   * 35s Grace Period: Does NOT kill the call immediately so P2P audio continues while user uses other apps.
   */
  async handleDisconnect(client: Socket) {
    this.logger.log(`🔴 Socket disconnected: ${client.id}`);

    const meta = this.socketMeta.get(client.id);
    if (meta) {
      const { roomName, userId } = meta;
      this.socketMeta.delete(client.id);

      const participants = this.roomParticipants.get(roomName);
      if (participants) {
        participants.delete(client.id);
      }

      const graceKey = `${roomName}:${userId}`;
      if (this.disconnectGraceTimeouts.has(graceKey)) {
        clearTimeout(this.disconnectGraceTimeouts.get(graceKey)!);
      }

      this.logger.log(
        `⏳ User ${userId} disconnected from room ${roomName}. Starting 35s background grace period. WebRTC audio remains active.`,
      );

      // 35 seconds grace period before terminating call session
      const timeout = setTimeout(async () => {
        this.disconnectGraceTimeouts.delete(graceKey);
        this.logger.log(
          `⏰ Grace period expired for user ${userId} in room ${roomName}. Ending session.`,
        );

        const currentParticipants = this.roomParticipants.get(roomName);
        if (!currentParticipants || currentParticipants.size === 0) {
          this.roomParticipants.delete(roomName);
          this.roomProfiles.delete(roomName);
        } else {
          this.server.to(roomName).emit('call-ended', {
            endedBy: userId,
            reason: 'partner_disconnected',
            message: 'Your conversation partner was disconnected.',
          });
          this.server.to(roomName).emit('partner-disconnected', {
            userId,
            message: 'Your conversation partner was disconnected.',
          });
        }

        await this.callsService.endCallSession(roomName, userId);
      }, 35000);

      this.disconnectGraceTimeouts.set(graceKey, timeout);
    }
  }

  /**
   * 1. Join Audio Room
   * --------------------------------------------------------
   * Mobile app matchmaking hone ke baad matched room ko join karti hai.
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; userId: string; username: string; userProfile?: any },
  ) {
    const { roomName, userId, username, userProfile } = payload;
    client.join(roomName);

    // Cancel any pending disconnect grace timeout if user resumed from background
    const graceKey = `${roomName}:${userId}`;
    const pendingTimeout = this.disconnectGraceTimeouts.get(graceKey);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.disconnectGraceTimeouts.delete(graceKey);
      this.logger.log(`🟢 User ${userId} reconnected to room ${roomName} from background! Call continuing.`);
    }

    if (!this.roomParticipants.has(roomName)) {
      this.roomParticipants.set(roomName, new Set());
    }
    this.roomParticipants.get(roomName)!.add(client.id);
    this.socketMeta.set(client.id, { userId, roomName });

    if (!this.roomProfiles.has(roomName)) {
      this.roomProfiles.set(roomName, new Map());
    }

    // Live profile store karein aur partner ko emit karein
    if (userProfile) {
      this.roomProfiles.get(roomName)!.set(userId, userProfile);
      client.to(roomName).emit('partner-profile', userProfile);
    }

    // Room me pehle se maujood partner ka profile is naye client ko bhejein
    const existingProfiles = this.roomProfiles.get(roomName)!;
    for (const [otherId, otherProf] of existingProfiles.entries()) {
      if (otherId !== userId && otherProf) {
        client.emit('partner-profile', otherProf);
      }
    }

    this.logger.log(`👤 ${username} (${userId}) joined room: ${roomName}`);

    const participantCount = this.roomParticipants.get(roomName)!.size;

    // Agar dono partners room mein enter ho gaye hain
    if (participantCount >= 2) {
      this.logger.log(`🎙️ Both participants present in room: ${roomName}. Emitting call-ready!`);
      // Dono ko ready signal bhejna taaki WebRTC audio offer create ho sake
      this.server.to(roomName).emit('call-ready', {
        roomName,
        message: 'Both learners are connected. Initiating audio stream...',
      });
    }

    return { status: 'JOINED', roomName, participantCount };
  }

  /**
   * Live Profile Sync
   * --------------------------------------------------------
   * Jab bhi koi user apni profile update karta hai call ke dauraan.
   */
  @SubscribeMessage('sync-profile')
  handleSyncProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; userProfile: any },
  ) {
    const { roomName, userProfile } = payload;
    if (roomName && userProfile) {
      const meta = this.socketMeta.get(client.id);
      if (meta && this.roomProfiles.has(roomName)) {
        this.roomProfiles.get(roomName)!.set(meta.userId, userProfile);
      }
      client.to(roomName).emit('partner-profile', userProfile);
    }
  }

  /**
   * 2. WebRTC Audio SDP Offer
   * --------------------------------------------------------
   * Caller apne audio parameters ka offer doosre peer ko bhejta hai.
   */
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; sdp: any },
  ) {
    client.to(payload.roomName).emit('offer', {
      sdp: payload.sdp,
    });
  }

  /**
   * 3. WebRTC Audio SDP Answer
   * --------------------------------------------------------
   * Receiver offer accept karke answer bhejta hai.
   */
  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; sdp: any },
  ) {
    client.to(payload.roomName).emit('answer', {
      sdp: payload.sdp,
    });
  }

  /**
   * 4. WebRTC ICE Candidate
   * --------------------------------------------------------
   * Direct Peer-to-Peer network packets exchange karna.
   */
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; candidate: any },
  ) {
    client.to(payload.roomName).emit('ice-candidate', {
      candidate: payload.candidate,
    });
  }

  /**
   * 5. Mute/Unmute Toggle Sync
   * --------------------------------------------------------
   * Partner ke phone screen par mic waveform animation sync karna.
   */
  @SubscribeMessage('mute-toggle')
  handleMuteToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; isMuted: boolean; userId: string },
  ) {
    client.to(payload.roomName).emit('partner-mute-status', {
      isMuted: payload.isMuted,
      userId: payload.userId,
    });
  }

  /**
   * 6. Socket Heartbeat / Keepalive
   * --------------------------------------------------------
   * Render reverse proxy ke idle disconnect ko rokne ke liye
   * client har 20s me ping bhejta hai.
   */
  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; userId: string; timestamp?: number },
  ) {
    if (payload.roomName && payload.userId) {
      const graceKey = `${payload.roomName}:${payload.userId}`;
      const pendingTimeout = this.disconnectGraceTimeouts.get(graceKey);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        this.disconnectGraceTimeouts.delete(graceKey);
      }
    }
    // Acknowledge heartbeat back to client
    return { status: 'PONG', timestamp: Date.now() };
  }

  /**
   * 7. Leave Room / End Call
   * --------------------------------------------------------
   * Call khatam hone par duration calculate karna, database update karna,
   * aur dono clients ko feedback screen par redirect karwana.
   */
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomName: string; userId: string; durationSec?: number },
  ) {
    const { roomName, userId, durationSec } = payload;
    this.logger.log(`🛑 User ${userId} requested to end call in room: ${roomName}`);

    const graceKey = `${roomName}:${userId}`;
    const pendingTimeout = this.disconnectGraceTimeouts.get(graceKey);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.disconnectGraceTimeouts.delete(graceKey);
    }

    // Database mein call complete mark karna aur minutes add karna
    const summary = await this.callsService.endCallSession(roomName, userId, durationSec);

    // Dono phones ko call-ended emit karna taaki feedback popup open ho
    this.server.to(roomName).emit('call-ended', {
      endedBy: userId,
      summary,
    });

    client.leave(roomName);
    this.socketMeta.delete(client.id);

    const participants = this.roomParticipants.get(roomName);
    if (participants) {
      participants.delete(client.id);
      if (participants.size === 0) {
        this.roomParticipants.delete(roomName);
      }
    }

    return { status: 'ENDED', summary };
  }
}
