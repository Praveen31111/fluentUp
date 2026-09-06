# 📹 FluentUp - 100% Zero-Cost WebRTC Video Calling Implementation Guide

> **Document Version:** 1.0.0  
> **Target Platform:** Android (Expo SDK 54, React Native 0.81.5) & WebRTC  
> **Server Infrastructure Cost:** **$0.00 / ₹0.00 (Permanent Free Tier)**  
> **Architecture:** Direct Peer-to-Peer (UDP) Video Stream + Google Free STUN Network  

---

## 📑 Table of Contents
1. [Overview & Zero-Cost Architecture](#1-overview--zero-cost-architecture)
2. [Why Video Calling Costs $0.00?](#2-why-video-calling-costs-000)
3. [End-to-End System Architecture Diagram](#3-end-to-end-system-architecture-diagram)
4. [Step-by-Step Implementation Roadmap](#4-step-by-step-implementation-roadmap)
   - [Step 1: Android Camera Permissions & Expo Config](#step-1-android-camera-permissions--expo-config)
   - [Step 2: Native WebRTC Video Stream & Camera Pipeline](#step-2-native-webrtc-video-stream--camera-pipeline)
   - [Step 3: WebSockets Camera State Signaling](#step-3-websockets-camera-state-signaling)
   - [Step 4: Live Video Call UI & Picture-in-Picture (PiP)](#step-4-live-video-call-ui--picture-in-picture-pip)
   - [Step 5: Bandwidth, Battery & Audio Optimization](#step-5-bandwidth-battery--audio-optimization)
5. [User Flow & Experience Walkthrough](#5-user-flow--experience-walkthrough)
6. [Testing & Verification Checklist](#6-testing--verification-checklist)

---

## 1. Overview & Zero-Cost Architecture

FluentUp introduces **High-Definition 1-on-1 Video Calling** designed specifically for English language practice. 

Unlike commercial services (such as Agora, Twilio, or 100ms) which charge **$0.004 to $0.015 per user per minute** (quickly ballooning to thousands of dollars with scale), FluentUp is architected to be **100% free forever** by utilizing:
- **Direct Peer-to-Peer (P2P) UDP Streaming** via `react-native-webrtc`.
- **Google's Free Global STUN Network** (`stun:stun.l.google.com:19302`) for NAT traversal and IP discovery.
- **Render Free Tier Signaling Server** (exchanging only lightweight SDP text strings under 2KB).

---

## 2. Why Video Calling Costs $0.00?

| Feature | Commercial Paid SDKs (Agora / Twilio) | FluentUp WebRTC Architecture |
| :--- | :--- | :--- |
| **Server Bandwidth Cost** | $4 – $15 per 1,000 call minutes | **$0.00 (Zero video data touches your server)** |
| **Video Processing Media Server** | Paid media SFU/MCU servers | **Client-side Hardware Acceleration (Phone GPUs)** |
| **STUN NAT Traversal** | Paid proprietary relays | **Google Public STUN (Free, unlimited & permanent)** |
| **Monthly Minimums** | $50 – $500 / month | **$0.00 (No credit card or external accounts)** |
| **Privacy & Security** | Streams routed through third-party servers | **End-to-end encrypted directly phone-to-phone** |

---

## 3. End-to-End System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                               FLUENTUP ZERO-COST P2P                              |
+-----------------------------------------------------------------------------------+

     [ User A (Android) ]                                    [ User B (Android) ]
    +--------------------+                                  +--------------------+
    | Front Camera 720p  |                                  | Front Camera 720p  |
    | Microphone (Opus)  |                                  | Microphone (Opus)  |
    | RTCView (PiP View) |                                  | RTCView (PiP View) |
    +---------+----------+                                  +----------+---------+
              |                                                        |
              | 1. Public IP & Port Discovery                          | 1. Public IP & Port Discovery
              v                                                        v
   +-------------------------------------------------------------------------------+
   |                      GOOGLE FREE PUBLIC STUN NETWORK                          |
   |              (stun:stun.l.google.com:19302 / stun:stun1.l.google.com)          |
   +---------------------------------------+---------------------------------------+
                                           |
                         2. Exchange SDP Handshake (~2KB JSON)
                                           v
   +-------------------------------------------------------------------------------+
   |                      RENDER NESTJS SIGNALING GATEWAY                          |
   |       (Transfers Offer, Answer, Ice Candidates & Partner Profile)             |
   +---------------------------------------+---------------------------------------+
                                           |
                                           | 3. Direct Phone-to-Phone Connection
                                           v
    =============================================================================
    >>> DIRECT P2P HIGH-DEFINITION VIDEO & AUDIO ENCRYPTED OVER UDP (SRTP/DTLS) <<<
    >>>                ZERO SERVER BANDWIDTH / 100% UNLIMITED USAGE             <<<
    =============================================================================
```

---

## 4. Step-by-Step Implementation Roadmap

### Step 1: Android Camera Permissions & Expo Config
**File:** `fluentUp/app.json`

Ensure Android runtime permissions include camera access alongside foreground microphone services:
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.RECORD_AUDIO",
  "android.permission.MODIFY_AUDIO_SETTINGS",
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.WAKE_LOCK",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MICROPHONE",
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
  "android.permission.BLUETOOTH_CONNECT"
]
```

---

### Step 2: Native WebRTC Video Stream & Camera Pipeline
**File:** `fluentUp/services/webrtc.ts`

1. **Hardware Camera Capture:**
   Capture local camera stream with optimal 720p resolution and 30fps:
   ```typescript
   import { mediaDevices, RTCView } from 'react-native-webrtc';

   async startLocalVideo() {
     const videoStream = await mediaDevices.getUserMedia({
       audio: false,
       video: {
         width: { ideal: 1280 },
         height: { ideal: 720 },
         frameRate: { ideal: 30 },
         facingMode: 'user', // Front camera default
       },
     });
     return videoStream;
   }
   ```

2. **Dynamic Video Track Toggle:**
   Enable or disable camera without renegotiating or disrupting the audio call:
   ```typescript
   toggleVideo(enabled: boolean) {
     if (this.localStream) {
       this.localStream.getVideoTracks().forEach((track: any) => {
         track.enabled = enabled;
       });
     }
   }
   ```

3. **Front / Rear Camera Switch:**
   ```typescript
   switchCamera() {
     if (this.localStream) {
       this.localStream.getVideoTracks().forEach((track: any) => {
         track._switchCamera();
       });
     }
   }
   ```

---

### Step 3: WebSockets Camera State Signaling
**Files:** `fluentUp/services/socket.ts` & `server/src/calls/calls.gateway.ts`

Notify the other phone whenever the camera is turned ON or OFF:
1. **Client Event Emit (`socket.ts`):**
   ```typescript
   toggleVideoStatus(roomName: string, isVideoEnabled: boolean, userId: string) {
     this.socket?.emit('video-toggle', { roomName, isVideoEnabled, userId });
   }
   ```
2. **Server Gateway Relay (`calls.gateway.ts`):**
   ```typescript
   @SubscribeMessage('video-toggle')
   handleVideoToggle(
     @ConnectedSocket() client: Socket,
     @MessageBody() payload: { roomName: string; isVideoEnabled: boolean; userId: string },
   ) {
     client.to(payload.roomName).emit('partner-video-status', {
       isVideoEnabled: payload.isVideoEnabled,
       userId: payload.userId,
     });
   }
   ```

---

### Step 4: Live Video Call UI & Picture-in-Picture (PiP)
**File:** `fluentUp/app/call.tsx`

1. **Audio-First Design with Video Upgrade:**
   - Call connects instantly in comfortable audio mode.
   - Dock contains a **"Video"** button (`videocam` / `videocam-off`) and a **"Flip"** button (`flip-camera-android`).

2. **Split Video Rendering:**
   ```tsx
   import { RTCView } from 'react-native-webrtc';

   {/* 1. Partner Full-Screen or Center Card Video */}
   {isPartnerVideoEnabled && remoteStream ? (
     <RTCView
       streamURL={remoteStream.toURL()}
       style={styles.partnerVideoFeed}
       objectFit="cover"
     />
   ) : (
     /* Fallback to Avatar Presence Hub */
     <Image source={{ uri: displayPartner?.avatar }} style={styles.avatarImg} />
   )}

   {/* 2. Self Floating Picture-in-Picture (PiP) Window */}
   {isLocalVideoEnabled && localStream ? (
     <View style={styles.selfPipContainer}>
       <RTCView
         streamURL={localStream.toURL()}
         style={styles.selfPipVideo}
         objectFit="cover"
         mirror={isFrontCamera}
       />
       <TouchableOpacity style={styles.flipBtn} onPress={handleFlipCamera}>
         <MaterialIcons name="flip-camera-android" size={18} color="#FFF" />
       </TouchableOpacity>
     </View>
   ) : null}
   ```

---

### Step 5: Bandwidth, Battery & Audio Optimization

1. **Audio Priority via Opus:**
   Even in fluctuating 4G networks, audio packets are prioritized over video to ensure the speaking conversation never stutters.
2. **Dynamic Resolution Scaling:**
   WebRTC automatically downscales resolution (720p $\rightarrow$ 480p $\rightarrow$ 360p) on low-bandwidth connections, keeping the stream 100% real-time without buffering.
3. **Discontinuous Transmission (`usedtx=1`):**
   Saves phone battery when neither user is speaking.

---

## 5. User Flow & Experience Walkthrough

1. **Step 1:** User taps **"Find a partner"** on the Home screen.
2. **Step 2:** Radar finds an active online speaker in 3–8 seconds.
3. **Step 3:** Call connects in **Audio-First Mode** (stress-free for beginners).
4. **Step 4:** User taps **"Video"** button $\rightarrow$ Android camera activates $\rightarrow$ User sees self in a small floating corner window $\rightarrow$ Partner sees high-definition live video stream.
5. **Step 5:** Tap **"Flip Camera"** to show surroundings, notes, or books during practice.
6. **Step 6:** Tap **"Video Off"** at any moment to return to pure voice mode without disconnecting the call.
7. **Step 7:** Tap **"End Call"** $\rightarrow$ Session ends and minutes are credited to profile.

---

## 6. Testing & Verification Checklist

- [ ] Camera runtime permission prompt on Android 10/11/12/13/14.
- [ ] Local front camera stream renders in floating PiP window without lag.
- [ ] Remote video stream renders on the partner's phone screen in real time.
- [ ] Camera flip alternates seamlessly between front and back lens.
- [ ] Toggling camera OFF transitions cleanly back to avatar mode while audio continues unbroken.
- [ ] App minimization / switching apps keeps audio stream active in background.
- [ ] Zero compilation errors on `nest build` and `npx tsc --noEmit`.
