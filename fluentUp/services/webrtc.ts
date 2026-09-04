// ========================================================
// FluentUp - Native WebRTC Peer-to-Peer Audio Service
// ========================================================
// Yeh service 1-on-1 English conversations ke liye:
// 1. Phone ka hardware microphone access karti hai (getUserMedia)
// 2. STUN Server (Google Public STUN) se NAT traversal karti hai
// 3. Socket.IO CallsGateway ke through SDP Offer/Answer aur ICE Candidates exchange karti hai
// 4. Direct phone-to-phone audio stream chalaati hai (Zero Server Bandwidth Cost)
// 5. Hardware Mic Mute/Unmute toggle karti hai
// 6. Expo Go development fallback support karti hai
// ========================================================

import { callSocketService } from './socket';

// Safe dynamic WebRTC loading (Expo Go vs Development Build)
let RTCPeerConnectionClass: any = null;
let RTCIceCandidateClass: any = null;
let RTCSessionDescriptionClass: any = null;
let mediaDevicesInstance: any = null;
let isNativeWebRTCAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webrtc = require('react-native-webrtc');
  if (webrtc && webrtc.RTCPeerConnection) {
    RTCPeerConnectionClass = webrtc.RTCPeerConnection;
    RTCIceCandidateClass = webrtc.RTCIceCandidate;
    RTCSessionDescriptionClass = webrtc.RTCSessionDescription;
    mediaDevicesInstance = webrtc.mediaDevices;
    isNativeWebRTCAvailable = true;
  }
} catch {
  // Running in Expo Go without custom native C++ WebRTC binaries
  isNativeWebRTCAvailable = false;
}

// Free Google Public STUN servers for NAT Traversal (Zero cost)
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class WebRTCService {
  private peerConnection: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private currentRoom: string | null = null;
  private isNativeSupported = isNativeWebRTCAvailable;

  constructor() {
    this.isNativeSupported = isNativeWebRTCAvailable;
  }

  /**
   * 1. Request Microphone Permission & Capture Local Audio Stream
   * ------------------------------------------------------------
   * Phone OS se audio recording permission mangta hai aur mic stream initialize karta hai.
   */
  async startLocalAudio(): Promise<any> {
    if (!this.isNativeSupported || !mediaDevicesInstance) {
      console.warn(
        '⚠️ WebRTC Notice: Native drivers simulated in Expo Go. For live P2P audio, run development build: npx expo run:android',
      );
      return null;
    }

    try {
      // Release any lingering past audio streams
      this.stopLocalAudio();

      // Request hardware microphone access (audio only, no video)
      const stream = await mediaDevicesInstance.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream = stream;
      console.log('🎤 Hardware microphone stream acquired successfully!');
      return stream;
    } catch (error: any) {
      console.error('❌ Failed to access microphone:', error.message || error);
      return null;
    }
  }

  /**
   * 2. Initialize PeerConnection & Setup WebRTC Call
   * ------------------------------------------------------------
   * @param roomName Socket signaling room channel
   * @param isCaller Batata hai kaun Offer bhejega aur kaun Answer karega
   */
  async initializeCall(
    roomName: string,
    isCaller: boolean,
    onRemoteStreamReady?: (stream: any) => void,
  ) {
    this.currentRoom = roomName;

    if (!this.isNativeSupported || !RTCPeerConnectionClass) {
      console.log('ℹ️ Running Call in simulated WebRTC mode.');
      return;
    }

    try {
      // 1. Ensure local microphone stream is ready
      if (!this.localStream) {
        await this.startLocalAudio();
      }

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnectionClass(ICE_CONFIG);
      this.peerConnection = pc;

      // 3. Inject local audio tracks into connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track: any) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      // 4. Remote peer audio stream listener
      (pc as any).ontrack = (event: any) => {
        console.log('🔊 Remote peer audio stream received!');
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          if (onRemoteStreamReady) {
            onRemoteStreamReady(event.streams[0]);
          }
        }
      };

      // 5. ICE Candidate generator & relay to signaling server
      (pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          callSocketService.sendIceCandidate(roomName, event.candidate);
        }
      };

      // 6. Incoming ICE Candidate listener
      callSocketService.onIceCandidate(async ({ candidate }) => {
        try {
          if (this.peerConnection && candidate && RTCIceCandidateClass) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidateClass(candidate));
          }
        } catch (e: any) {
          console.warn('Could not add ICE candidate:', e.message);
        }
      });

      // 7. Incoming Answer listener (Caller side)
      callSocketService.onAnswer(async ({ sdp }) => {
        try {
          if (this.peerConnection && sdp && RTCSessionDescriptionClass) {
            console.log('📥 Setting remote description from Answer...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescriptionClass(sdp));
          }
        } catch (e: any) {
          console.error('Error handling answer SDP:', e.message);
        }
      });

      // 8. Incoming Offer listener (Receiver side)
      callSocketService.onOffer(async ({ sdp }) => {
        try {
          if (this.peerConnection && sdp && RTCSessionDescriptionClass) {
            console.log('📥 Setting remote description from Offer & creating Answer...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescriptionClass(sdp));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            callSocketService.sendAnswer(roomName, answer);
          }
        } catch (e: any) {
          console.error('Error handling offer SDP:', e.message);
        }
      });

      // 9. If caller, generate and emit SDP Offer
      if (isCaller) {
        console.log('📤 Generating SDP Offer as caller...');
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await this.peerConnection.setLocalDescription(offer);
        callSocketService.sendOffer(roomName, offer);
      }
    } catch (error: any) {
      console.error('❌ Error initializing WebRTC call:', error.message || error);
    }
  }

  /**
   * 3. Hardware Microphone Mute / Unmute
   */
  setMuted(isMuted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !isMuted;
      });
      console.log(`🎙️ Hardware mic track ${isMuted ? 'MUTED' : 'ACTIVE'}`);
    }
  }

  /**
   * 4. Stop local audio recording
   */
  stopLocalAudio() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * 5. Call Teardown & Resource Cleanup
   */
  cleanup() {
    console.log('🔌 Cleaning up WebRTC audio connection and releasing mic...');
    this.stopLocalAudio();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.currentRoom = null;
  }
}

export const webrtcService = new WebRTCService();
