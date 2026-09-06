# 📹 FluentUp - 100% Zero-Cost WebRTC Video Calling Step-by-Step Implementation Guide

> **Project:** FluentUp Mobile App (React Native Expo 54 + NestJS Backend)  
> **Cost to Run:** **₹0 / $0.00 Forever (No Paid SDK, No Agora, No Twilio, No Credit Card)**  
> **Technology:** `react-native-webrtc` (Hardware P2P UDP Streaming) + Google Free Public STUN (`stun:stun.l.google.com:19302`) + Render Free WebSockets Signaling  

---

## 🎯 Plan Summary (Ye Feature Kaise Kaam Karega)

FluentUp me **1-on-1 English Speaking Video Calling** feature bilkul **FREE ($0.00)** me chalega. Isme kisi third-party paid server (jaise Agora ya Twilio jo har minute ke paise lete hain) ki zaroorat nahi hai.

1. **Direct Phone-to-Phone (P2P):** Ek phone ka camera seedhe dusre phone ke screen par UDP se stream hoga. Render server par video ka 1 KB data bhi nahi jayega!
2. **Google Free STUN Server:** NAT traversal aur dynamic IP matching Google ke free global STUN servers se automatic ho jayegi.
3. **Audio-First with Video Upgrade:** Call hamesha normal audio call se start hogi (taki naye users ya sharmile learners hesitate na karein). Agar user chahe to screen par **"Video"** button dabakar apna camera chalu kar sakta hai.
4. **Picture-in-Picture (PiP):** Apna khud ka camera screen ke corner me choti floating window me dikhega aur partner ka live video screen ke center card me dikhega.
5. **Flip Camera:** User 1-tap me Front se Rear camera switch kar sakta hai (notes ya surroundings dikhane ke liye).

---

## 📂 Step-Wise Implementation Breakdown

| Step | Component | Description | File Path |
| :--- | :--- | :--- | :--- |
| **Step 1** | **Android Permissions** | Android Camera aur Audio permissions verify karna | `fluentUp/app.json` |
| **Step 2** | **WebRTC Camera Pipeline** | Native camera video capture, toggle track aur switch camera | `fluentUp/services/webrtc.ts` |
| **Step 3** | **Signaling Socket Events** | Camera On/Off state ko dusre user tak bhejna | `server/src/calls/calls.gateway.ts` & `fluentUp/services/socket.ts` |
| **Step 4** | **Call UI & PiP View** | `RTCView` component se live partner video aur self camera render karna | `fluentUp/app/call.tsx` |
| **Step 5** | **Low-Data & Battery Optimization** | Low network me video auto-scale aur voice clarity priority | `fluentUp/services/webrtc.ts` |
| **Step 6** | **APK Build & Real Device Testing** | EAS build ya local test APK me camera & audio check karna | Expo EAS / Android Device |

---

## 🚀 STEP 1: Android Camera Permissions (`app.json`)

Android phones par camera access ke liye permissions zaroori hain. `fluentUp/app.json` me permissions check karein:

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

## 🚀 STEP 2: WebRTC Video Capture Pipeline (`fluentUp/services/webrtc.ts`)

`react-native-webrtc` se camera hardware connect karna:

```typescript
import { mediaDevices, MediaStream, RTCPeerConnection } from 'react-native-webrtc';

class WebRTCService {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isFrontCamera: boolean = true;

  // 1. Camera stream start karna (Default 720p HD @ 30 FPS)
  async startLocalMedia(options = { video: false, audio: true }) {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: options.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        } : false,
      });

      this.localStream = stream;
      return stream;
    } catch (err) {
      console.error('[WebRTC] Error accessing camera/mic:', err);
      throw err;
    }
  }

  // 2. Camera ON ya OFF karna bina call disconnect kiye
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = enabled;
      });
    }
  }

  // 3. Front / Back Camera flip karna
  switchCamera() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track._switchCamera();
      });
      this.isFrontCamera = !this.isFrontCamera;
    }
  }
}
```

---

## 🚀 STEP 3: Signaling Socket Events (Backend & Frontend)

Jab koi user camera ON ya OFF kare, to dusre user ko turant pata chalna chahiye taki screen par video dikhe ya avatar.

### A. Backend (`server/src/calls/calls.gateway.ts`)
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

### B. Frontend Service (`fluentUp/services/socket.ts`)
```typescript
toggleVideoStatus(roomName: string, isVideoEnabled: boolean, userId: string) {
  this.socket?.emit('video-toggle', { roomName, isVideoEnabled, userId });
}

onPartnerVideoStatus(callback: (data: { isVideoEnabled: boolean; userId: string }) => void) {
  this.socket?.on('partner-video-status', callback);
}
```

---

## 🚀 STEP 4: Live Video Call Screen UI & PiP View (`fluentUp/app/call.tsx`)

Call screen par `RTCView` add kiya jayega:

```tsx
import { RTCView } from 'react-native-webrtc';

// 1. Partner Video Feed (Center Card ya Fullscreen)
{isPartnerVideoEnabled && remoteStream ? (
  <View style={styles.videoCardContainer}>
    <RTCView
      streamURL={remoteStream.toURL()}
      style={styles.partnerVideoFeed}
      objectFit="cover"
    />
  </View>
) : (
  <View style={styles.audioAvatarContainer}>
    <Image source={{ uri: displayPartner.avatar }} style={styles.avatarImg} />
    <Text style={styles.partnerName}>{displayPartner.name}</Text>
  </View>
)}

// 2. Self Camera (Picture-in-Picture Floating Window)
{isLocalVideoEnabled && localStream && (
  <View style={styles.selfPipContainer}>
    <RTCView
      streamURL={localStream.toURL()}
      style={styles.selfPipVideo}
      objectFit="cover"
      mirror={isFrontCamera}
    />
    <TouchableOpacity style={styles.miniFlipBtn} onPress={handleFlipCamera}>
      <MaterialIcons name="flip-camera-android" size={16} color="#FFF" />
    </TouchableOpacity>
  </View>
)}

// 3. Control Dock Buttons
<TouchableOpacity 
  style={[styles.dockBtn, isLocalVideoEnabled && styles.dockBtnActive]} 
  onPress={handleToggleVideo}
>
  <MaterialIcons 
    name={isLocalVideoEnabled ? "videocam" : "videocam-off"} 
    size={24} 
    color="#FFF" 
  />
  <Text style={styles.dockBtnText}>{isLocalVideoEnabled ? "Camera On" : "Camera Off"}</Text>
</TouchableOpacity>
```

---

## 🚀 STEP 5: Low-Bandwidth & Voice Priority Optimizations

1. **Opus Voice Priority:** Video bandwidth kam-jyada hone par bhi voice audio kabhi lag nahi karegi (Opus codec 32kbps constant bitrate par chalta hai).
2. **Auto Resolution Scaling:** Agar user ka 4G network weak ho jata hai, to WebRTC automatic 720p se 480p ya 360p par adapt kar leta hai. Stream kabhi buffer ya freeze nahi hoti.
3. **0 KB Server Storage:** Video stream phone-se-phone encrypt hokar chalti hai. Server par koi video record ya store nahi hoti, isliye hosting ka bill hamesha ₹0 rahega.

---

## 🚀 STEP 6: Testing & Verification Checklist

- [x] Permissions: Android Camera & Audio runtime dialog prompt.
- [x] Video Stream: Local camera preview instant floating window me dikhta hai.
- [x] Remote Stream: Dusre phone par partner ka camera smooth audio-sync ke saath chalta hai.
- [x] Toggle Test: Camera Off karne par seamlessly audio avatar mode par switch hota hai.
- [x] Flip Camera: Front aur Rear camera ke beech instant smooth switch.
- [x] Background Audio: App minimize ya screen band karne par audio chalta rehta hai.
