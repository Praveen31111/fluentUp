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

  constructor(private readonly callsService: CallsService) {}

  /**
   * Client connected
   */
  handleConnection(client: Socket) {
    this.logger.log(`🟢 Socket connected: ${client.id}`);
  }

  /**
   * Client disconnected (Unexpected network drop ya app minimize)
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
        if (participants.size === 0) {
          this.roomParticipants.delete(roomName);
        } else {
          // Partner ko inform karna ki partner disconnect ho gaya
          client.to(roomName).emit('partner-disconnected', {
            userId,
            message: 'Your conversation partner was disconnected.',
          });
        }
      }

      // Call session end karke minutes save karna
      await this.callsService.endCallSession(roomName, userId);
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
    @MessageBody() payload: { roomName: string; userId: string; username: string },
  ) {
    const { roomName, userId, username } = payload;
    client.join(roomName);

    if (!this.roomParticipants.has(roomName)) {
      this.roomParticipants.set(roomName, new Set());
    }
    this.roomParticipants.get(roomName)!.add(client.id);
    this.socketMeta.set(client.id, { userId, roomName });

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
   * 6. Leave Room / End Call
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
