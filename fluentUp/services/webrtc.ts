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

import { PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { callSocketService } from './socket';
import { API_BASE_URL } from '../constants/config';
import { detectAudioDevices, setPreferredAudioInput } from './audioDevice';

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

// High-Reliability STUN + Global TURN servers for NAT Traversal
// Google + Cloudflare STUN are 100% free, permanent, and have zero time limits.
export const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Metered TURN Relay for Carrier-Grade NAT (Jio/Airtel 4G/5G)
    // To plug your free 50GB account credentials, replace username & credential below:
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * PeerUp / Discord Grade Opus Audio Optimization:
 * 1. useinbandfec=1       : Forward Error Correction (eliminates jitter & packet loss on 4G)
 * 2. usedtx=1             : Discontinuous Transmission (saves phone battery & bandwidth during pauses)
 * 3. maxaveragebitrate    : 32000 bps (Optimal bit depth for human voice clarity)
 * 4. stereo=0             : Mono speech channel focus
 */
function optimizeOpusSdp(sdp: string): string {
  if (!sdp) return sdp;
  const lines = sdp.split('\r\n');
  let opusPt = '111';

  for (const line of lines) {
    const match = line.match(/^a=rtpmap:(\d+)\s+opus\/48000/i);
    if (match) {
      opusPt = match[1];
      break;
    }
  }

  let fmtpFound = false;
  const newLines = lines.map((line) => {
    if (line.startsWith(`a=fmtp:${opusPt}`)) {
      fmtpFound = true;
      let newLine = line;
      if (!newLine.includes('useinbandfec=')) newLine += ';useinbandfec=1';
      if (!newLine.includes('usedtx=')) newLine += ';usedtx=1';
      if (!newLine.includes('maxaveragebitrate=')) newLine += ';maxaveragebitrate=32000';
      if (!newLine.includes('stereo=')) newLine += ';stereo=0;sprop-stereo=0';
      return newLine;
    }
    return line;
  });

  if (!fmtpFound) {
    const rtpmapIndex = newLines.findIndex((l) => l.startsWith(`a=rtpmap:${opusPt}`));
    if (rtpmapIndex !== -1) {
      newLines.splice(
        rtpmapIndex + 1,
        0,
        `a=fmtp:${opusPt} minptime=10;useinbandfec=1;usedtx=1;maxaveragebitrate=32000;stereo=0;sprop-stereo=0`,
      );
    }
  }

  return newLines.join('\r\n');
}

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
   * Fetch dynamic production STUN/TURN servers from backend
   * Fallbacks safely to static ICE_CONFIG if backend is unreachable
   */
  async fetchIceServers(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/calls/ice-servers`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.iceServers && data.iceServers.length > 0) {
          console.log(`🌐 Loaded ${data.iceServers.length} dynamic ICE/TURN servers from backend.`);
          return {
            iceServers: data.iceServers,
            iceCandidatePoolSize: 10,
          };
        }
      }
    } catch (e: any) {
      console.warn('Notice: Using local STUN fallback servers:', e.message);
    }
    return ICE_CONFIG;
  }

  /**
   * 1. Request Microphone Permission & Capture Local Audio Stream
   * ------------------------------------------------------------
   * Android runtime audio permission mangta hai aur mic stream initialize karta hai.
   */
  async startLocalAudio(): Promise<any> {
    if (!this.isNativeSupported || !mediaDevicesInstance) {
      console.warn(
        '⚠️ WebRTC Notice: Native drivers simulated in Expo Go. For live P2P audio, run development build: npx expo run:android',
      );
      return null;
    }

    try {
      // 1. Android runtime dangerous permission request (Android 10/11/12/13/14/15)
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message:
                'FluentUp requires microphone access to let you speak with your English practice partner.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('❌ User denied microphone permission on Android!');
            return null;
          }
        }

        // Android 12+ (API 31+) Bluetooth connect runtime permission for Neckbands / TWS
        if (Platform.Version >= 31 && (PermissionsAndroid.PERMISSIONS as any).BLUETOOTH_CONNECT) {
          try {
            const hasBtPermission = await PermissionsAndroid.check(
              (PermissionsAndroid.PERMISSIONS as any).BLUETOOTH_CONNECT,
            );
            if (!hasBtPermission) {
              await PermissionsAndroid.request(
                (PermissionsAndroid.PERMISSIONS as any).BLUETOOTH_CONNECT,
                {
                  title: 'Bluetooth Headset Access',
                  message: 'FluentUp allows using your wireless neckband or Bluetooth earphones during calls.',
                  buttonPositive: 'Allow',
                  buttonNegative: 'Deny',
                },
              );
            }
          } catch (btErr: any) {
            console.log('Bluetooth permission notice:', btErr.message);
          }
        }
      }

      // 2. Hardware audio mode initialization for background persistence
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: false,
          staysActiveInBackground: true,
        });
        console.log('📱 Hardware AudioMode active (staysActiveInBackground: true)');
      } catch (e: any) {
        console.warn('AudioMode init notice:', e.message);
      }

      // Release any lingering past audio streams
      this.stopLocalAudio();

      // Request hardware microphone access (audio only, no video)
      const stream = await mediaDevicesInstance.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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

      // 2. Fetch dynamic ICE/TURN servers from backend
      const iceConfig = await this.fetchIceServers();
      const pc = new RTCPeerConnectionClass(iceConfig);
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

      // Candidate queue to avoid race condition before remote description is set
      const pendingCandidates: any[] = [];
      let isRemoteDescriptionSet = false;

      const drainCandidates = async () => {
        isRemoteDescriptionSet = true;
        while (pendingCandidates.length > 0) {
          const cand = pendingCandidates.shift();
          try {
            if (this.peerConnection && cand && RTCIceCandidateClass) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidateClass(cand));
            }
          } catch (err: any) {
            console.warn('Error draining candidate:', err);
          }
        }
      };

      // 5. ICE Candidate generator & relay to signaling server
      (pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          callSocketService.sendIceCandidate(roomName, event.candidate);
        }
      };

      // Auto ICE connection health monitor & auto-recovery
      (pc as any).oniceconnectionstatechange = async () => {
        const iceState = (pc as any).iceConnectionState;
        console.log('🔄 WebRTC ICE connection state:', iceState);
        if (iceState === 'disconnected' || iceState === 'failed') {
          console.log('⚠️ Network fluctuation detected, attempting ICE restart...');
          if (pc.restartIce) {
            pc.restartIce();
          }
          if (isCaller) {
            try {
              const offer = await pc.createOffer({ iceRestart: true });
              offer.sdp = optimizeOpusSdp(offer.sdp);
              await pc.setLocalDescription(offer);
              callSocketService.sendOffer(roomName, offer);
              console.log('🔄 Sent ICE restart offer to partner');
            } catch (err: any) {
              console.warn('ICE restart offer failed:', err.message);
            }
          }
        }
      };

      (pc as any).onconnectionstatechange = () => {
        console.log('🌐 WebRTC connection state:', (pc as any).connectionState);
      };

      // 6. Incoming ICE Candidate listener
      callSocketService.onIceCandidate(async ({ candidate }) => {
        try {
          if (candidate && RTCIceCandidateClass) {
            if (this.peerConnection && isRemoteDescriptionSet) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidateClass(candidate));
            } else {
              pendingCandidates.push(candidate);
            }
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
            await drainCandidates();
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
            await drainCandidates();
            const answer = await this.peerConnection.createAnswer();
            answer.sdp = optimizeOpusSdp(answer.sdp);
            await this.peerConnection.setLocalDescription(answer);
            callSocketService.sendAnswer(roomName, answer);
          }
        } catch (e: any) {
          console.error('Error handling offer SDP:', e.message);
        }
      });

      // 9. If caller, generate and emit SDP Offer after slight delay to ensure peer socket is ready
      if (isCaller) {
        const sendOffer = async () => {
          try {
            console.log('📤 Generating SDP Offer as caller...');
            const offer = await this.peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            });
            offer.sdp = optimizeOpusSdp(offer.sdp);
            await this.peerConnection.setLocalDescription(offer);
            callSocketService.sendOffer(roomName, offer);
          } catch (err: any) {
            console.error('❌ Failed to generate offer:', err.message);
          }
        };

        // Delay offer by 800ms so both devices have fully loaded the call screen & room socket
        setTimeout(sendOffer, 800);
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
   * 5. Set Audio Route: Loudspeaker, Earpiece, or Bluetooth / Headset
   */
  async setAudioRoute(route: 'speaker' | 'earpiece' | 'bluetooth') {
    try {
      if (route === 'speaker') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false, // Force Speakerphone
          shouldDuckAndroid: false,
          staysActiveInBackground: true,
        });
        console.log('🔊 Hardware audio routed to: LOUDSPEAKER');
      } else if (route === 'earpiece') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: true, // Phone top ear speaker
          shouldDuckAndroid: false,
          staysActiveInBackground: true,
        });
        console.log('📱 Hardware audio routed to: EARPIECE');
      } else {
        // Bluetooth / Headset default: allow Android OS to prioritize Bluetooth SCO / A2DP
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: false,
          staysActiveInBackground: true,
        });

        // Set hardware recording device specifically to connected headset mic
        try {
          const status = await detectAudioDevices();
          if (status.hasHeadset && status.headsetUid) {
            await setPreferredAudioInput(status.headsetUid);
          }
        } catch (inputErr) {
          // Fallback gracefully
        }

        console.log('🎧 Hardware audio & mic routed to: EARPHONE / BLUETOOTH');
      }
    } catch (e: any) {
      console.warn('Could not set audio route mode:', e.message);
    }
  }

  async setSpeaker(enableSpeaker: boolean) {
    return this.setAudioRoute(enableSpeaker ? 'speaker' : 'earpiece');
  }

  /**
   * 6. Call Teardown & Resource Cleanup
   */
  cleanup() {
    console.log('🔌 Cleaning up WebRTC audio connection and releasing mic...');
    this.stopLocalAudio();
    this.setSpeaker(false).catch(() => {});

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.currentRoom = null;
  }
}

export const webrtcService = new WebRTCService();
