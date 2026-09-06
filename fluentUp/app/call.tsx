/**
 * FluentUp - Active Audio Conversation Screen
 * 
 * Design Philosophy:
 * Zero screen clutter. No chat messages, no distracting video widgets, no unnecessary menus.
 * 
 * Features:
 * 1. Live call timer (MM:SS)
 * 2. Partner presence with voice activity glow
 * 3. Living soundwave visualizer reacting to spoken audio
 * 4. 3 Essential controls:
 *    - Mic (Mute / Unmute)
 *    - Speaker (Speakerphone / Earpiece)
 *    - End (Triggers confirmation sheet)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  AppState,
  AppStateStatus,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { EndCallSheet } from '@/components/EndCallSheet';
import { useApp } from '@/context/AppContext';
import { callSocketService } from '@/services/socket';
import { webrtcService } from '@/services/webrtc';

// Safe KeepAwake helper (prevents native module crash if missing or mismatched)
let safeKeepAwake: {
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
} = {
  activate: async () => {},
  deactivate: async () => {},
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const KeepAwake = require('expo-keep-awake');
  if (KeepAwake) {
    safeKeepAwake = {
      activate: async () => {
        try {
          if (KeepAwake.activateKeepAwakeAsync) {
            await KeepAwake.activateKeepAwakeAsync('fluentup-call-screen');
          }
        } catch (e) {}
      },
      deactivate: async () => {
        try {
          if (KeepAwake.deactivateKeepAwake) {
            await KeepAwake.deactivateKeepAwake('fluentup-call-screen');
          }
        } catch (e) {}
      },
    };
  }
} catch (err) {
  console.warn('Notice: expo-keep-awake native module not linked:', err);
}

export default function CallScreen() {
  const router = useRouter();
  const {
    user,
    activePartner,
    callDuration,
    isMuted,
    audioRoute,
    hasHeadsetConnected,
    headsetName,
    toggleMute,
    toggleSpeaker,
    endCall,
  } = useApp();

  // Safely activate KeepAwake tag to keep screen on without crashing
  React.useEffect(() => {
    safeKeepAwake.activate();
    return () => {
      safeKeepAwake.deactivate();
    };
  }, []);

  // Intercept Android slider back gesture / hardware back button to prevent accidental call drop
  React.useEffect(() => {
    const onBackPress = () => {
      // Accidental back slider gesture opens EndCallSheet instead of abruptly killing call
      setShowEndSheet(true);
      return true; // Prevents default navigation pop / unmount
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      backHandler.remove();
    };
  }, []);

  // End Call confirmation sheet visibility
  const [showEndSheet, setShowEndSheet] = useState<boolean>(false);
  const [isPartnerMuted, setIsPartnerMuted] = useState<boolean>(false);
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [livePartner, setLivePartner] = useState<any>(activePartner);

  // Sync initial partner data
  React.useEffect(() => {
    if (activePartner) {
      setLivePartner(activePartner);
    }
  }, [activePartner]);

  // Format seconds to MM:SS string
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Initialize WebRTC Hardware Microphone & P2P Stream + Live Profile Broadcast
  React.useEffect(() => {
    async function setupAudio() {
      if (activePartner?.roomName && user?.id) {
        // Ensure active socket signaling room connection with user's full profile for cross-device sync
        callSocketService.joinRoom(
          activePartner.roomName,
          user.id,
          user.username || 'Learner',
          {
            id: user.id,
            name: user.username,
            username: user.username,
            photoUrl: user.photoUrl,
            avatar: user.photoUrl,
            address: user.address,
            education: user.education,
            hobbies: user.hobbies,
            bio: user.bio,
            level: user.level,
          },
        );

        // Deterministic role: smaller ID acts as offerer (caller)
        const isCaller = user.id < (activePartner.id || '');
        await webrtcService.initializeCall(
          activePartner.roomName,
          isCaller,
          (_remoteStream) => {
            console.log('🔊 Remote audio stream active in Call screen');
            setIsPeerConnected(true);
          },
          (state) => {
            console.log('🌐 WebRTC connection state:', state);
            if (state === 'connected') {
              setIsPeerConnected(true);
            } else if (state === 'disconnected' || state === 'failed') {
              setIsPeerConnected(false);
            }
          },
        );
      }
    }

    setupAudio();

    return () => {
      webrtcService.cleanup();
    };
  }, [activePartner?.roomName, user?.id]);

  // 2. Sync mute state to hardware microphone
  React.useEffect(() => {
    webrtcService.setMuted(isMuted);
  }, [isMuted]);

  // 3. Sync audio route state (Bluetooth Headset / Loudspeaker / Earpiece)
  React.useEffect(() => {
    webrtcService.setAudioRoute(audioRoute);
  }, [audioRoute]);

  // 4. Periodic heartbeat to prevent Render reverse-proxy idle socket timeout
  React.useEffect(() => {
    if (!activePartner?.roomName || !user?.id) return;

    const heartbeatInterval = setInterval(() => {
      callSocketService.sendHeartbeat(activePartner.roomName!, user.id);
    }, 15000);

    return () => clearInterval(heartbeatInterval);
  }, [activePartner?.roomName, user?.id]);

  // 5. Socket event listeners for real-time room sync, partner profile & remote call end
  React.useEffect(() => {
    callSocketService.onPartnerMuteStatus((data) => {
      setIsPartnerMuted(data.isMuted);
    });

    callSocketService.onPartnerProfile((partnerData: any) => {
      console.log('👤 Live partner profile synced over socket:', partnerData?.name);
      if (partnerData) {
        setLivePartner((prev: any) => ({
          ...prev,
          name: partnerData.name || partnerData.username || prev?.name,
          avatar: partnerData.photoUrl || partnerData.avatar || prev?.avatar,
          address: partnerData.address || prev?.address,
          education: partnerData.education || prev?.education,
          hobbies:
            partnerData.hobbies && partnerData.hobbies.length > 0
              ? partnerData.hobbies
              : prev?.hobbies,
          level: partnerData.level ? `${partnerData.level} · Fluent` : prev?.level,
        }));
      }
    });

    const handleRemoteEnd = (data: any) => {
      console.log('🛑 Call ended remotely (partner left or disconnected):', data);
      webrtcService.cleanup();
      router.replace('/feedback');
    };

    callSocketService.onCallEnded(handleRemoteEnd);
    callSocketService.onPartnerDisconnected(handleRemoteEnd);
  }, [router]);

  // 6. Seamless Background Audio: Call continues uninterrupted when user opens another app
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 AppState changed to:', nextAppState);
      if (nextAppState === 'active') {
        // User returned to FluentUp, re-attach socket signaling if dropped
        if (activePartner?.roomName && user?.id) {
          callSocketService.joinRoom(
            activePartner.roomName,
            user.id,
            user.username || 'Learner',
            {
              id: user.id,
              name: user.username,
              username: user.username,
              photoUrl: user.photoUrl,
              avatar: user.photoUrl,
              address: user.address,
              education: user.education,
              hobbies: user.hobbies,
              bio: user.bio,
              level: user.level,
            },
          );
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [activePartner?.roomName, user]);

  // Combined real-time partner data
  const displayPartner = livePartner || activePartner;

  // Confirm End Call -> Navigate to Feedback Screen
  const handleConfirmEndCall = () => {
    setShowEndSheet(false);
    webrtcService.cleanup();
    endCall();
    router.replace('/feedback');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <View style={styles.container}>
        {/* Top Bar: Connection State & Duration */}
        <View style={styles.topBar}>
          <View style={styles.connectedPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.connectedText}>Connected</Text>
          </View>

          <View style={styles.timerPill}>
            <MaterialIcons name="schedule" size={15} color={FluentColors.secondaryText} />
            <Text style={styles.timerText}>{formatTime(callDuration)}</Text>
          </View>
        </View>

        {/* Center Partner Presence & Voice Rhythm */}
        <View style={styles.centerPresence}>
          {/* Partner Avatar with gentle breathing halo */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarGlowOuter} />
            <View style={styles.avatarGlowInner} />
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    (displayPartner?.avatar &&
                      (displayPartner.avatar.startsWith('http') || displayPartner.avatar.startsWith('data:image/')))
                      ? displayPartner.avatar
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                }}
                style={styles.avatarImg}
              />
              {/* Voice active badge */}
              <View style={styles.voiceIndicatorBadge}>
                <MaterialIcons name="graphic-eq" size={13} color={FluentColors.onPrimary} />
              </View>
            </View>
          </View>

          {/* Partner Details */}
          <Text style={styles.partnerName}>{displayPartner?.name || 'Speaking Partner'}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLang}>English</Text>
            <View style={styles.levelDividerDot} />
            <Text style={styles.levelCode}>{displayPartner?.level || 'C1 · Fluent'}</Text>
          </View>

          {/* Minimal Living Voice Waveform */}
          <View style={styles.waveformContainer}>
            <WaveformVisualizer
              barCount={11}
              activeColor={FluentColors.primaryContainer}
              isSpeaking={isPeerConnected && !isPartnerMuted && !isMuted}
            />
          </View>
          <Text style={styles.speakingStatus}>
            {!isPeerConnected
              ? `Connecting audio with ${displayPartner?.name || 'partner'}...`
              : isMuted
              ? 'Your microphone is muted'
              : isPartnerMuted
              ? `${displayPartner?.name || 'Partner'} is currently muted`
              : `${displayPartner?.name || 'Partner'} is connected · Speaking live`}
          </Text>

          {/* Partner Icebreaker Card (Address, Education, Hobbies) */}
          <View style={styles.icebreakerCard}>
            <View style={styles.icebreakerHeader}>
              <MaterialIcons name="lightbulb" size={14} color={FluentColors.primary} />
              <Text style={styles.icebreakerHeaderTitle}>PARTNER CONTEXT & HOBBIES</Text>
            </View>

            {/* Address & Education */}
            <View style={styles.partnerMetaRow}>
              {displayPartner?.address ? (
                <View style={styles.partnerMetaPill}>
                  <MaterialIcons name="location-on" size={13} color={FluentColors.primary} />
                  <Text style={styles.partnerMetaText}>{displayPartner.address}</Text>
                </View>
              ) : null}

              {displayPartner?.education ? (
                <View style={styles.partnerMetaPill}>
                  <MaterialIcons name="school" size={13} color={FluentColors.tertiary} />
                  <Text style={styles.partnerMetaText}>{displayPartner.education}</Text>
                </View>
              ) : null}
            </View>

            {/* Hobbies chips */}
            {displayPartner?.hobbies && displayPartner.hobbies.length > 0 ? (
              <View style={styles.partnerHobbiesWrap}>
                {displayPartner.hobbies.slice(0, 4).map((h: string, i: number) => (
                  <View key={i} style={styles.partnerHobbyTag}>
                    <Text style={styles.partnerHobbyTagText}>{h}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Bottom Floating Control Dock */}
        <View style={styles.bottomDockWrapper}>
          <View style={styles.controlDock}>
            {/* 1. Mute Toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dockButton}
              onPress={toggleMute}
            >
              <View
                style={[
                  styles.btnCircle,
                  isMuted ? styles.btnCircleMuted : styles.btnCircleDefault,
                ]}
              >
                <MaterialIcons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color={isMuted ? FluentColors.error : FluentColors.text}
                />
              </View>
              <Text
                style={[
                  styles.btnLabel,
                  isMuted && { color: FluentColors.error, fontWeight: '700' },
                ]}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            {/* 2. Audio Route Switcher (Dynamic Earphone / Speaker / Earpiece) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dockButton}
              onPress={toggleSpeaker}
            >
              <View
                style={[
                  styles.btnCircle,
                  (audioRoute === 'speaker' || (hasHeadsetConnected && audioRoute === 'bluetooth'))
                    ? styles.btnCircleSpeakerActive
                    : styles.btnCircleDefault,
                ]}
              >
                <MaterialIcons
                  name={
                    hasHeadsetConnected && audioRoute === 'bluetooth'
                      ? 'headset'
                      : audioRoute === 'speaker'
                      ? 'volume-up'
                      : 'phone-in-talk'
                  }
                  size={24}
                  color={
                    (audioRoute === 'speaker' || (hasHeadsetConnected && audioRoute === 'bluetooth'))
                      ? FluentColors.primaryContainer
                      : FluentColors.secondaryText
                  }
                />
              </View>
              <Text style={styles.btnLabel}>
                {hasHeadsetConnected && audioRoute === 'bluetooth'
                  ? 'Earphone'
                  : audioRoute === 'speaker'
                  ? 'Speaker'
                  : 'Earpiece'}
              </Text>
            </TouchableOpacity>

            {/* 3. End Call Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.dockButton}
              onPress={() => setShowEndSheet(true)}
            >
              <View style={styles.btnCircleEnd}>
                <MaterialIcons name="call-end" size={26} color={FluentColors.onError} />
              </View>
              <Text style={[styles.btnLabel, { color: FluentColors.error, fontWeight: '700' }]}>
                End
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Call Safe Exit Sheet */}
        <EndCallSheet
          visible={showEndSheet}
          partnerName={displayPartner?.name || 'Alex'}
          durationText={formatTime(callDuration)}
          onKeepTalking={() => setShowEndSheet(false)}
          onConfirmEnd={handleConfirmEndCall}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FluentColors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainer,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: FluentColors.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
  },
  centerPresence: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  avatarSection: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 18,
  },
  avatarGlowOuter: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: FluentColors.primaryFixed,
    opacity: 0.4,
  },
  avatarGlowInner: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(225, 221, 255, 0.6)',
  },
  avatarWrapper: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: FluentColors.surfaceLowest,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
  },
  voiceIndicatorBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FluentColors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FluentColors.surfaceLowest,
  },
  partnerName: {
    fontSize: 26,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainerHigh,
    marginBottom: 26,
  },
  levelLang: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  levelDividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: FluentColors.outline,
  },
  levelCode: {
    fontSize: 12,
    fontWeight: '700',
    color: FluentColors.text,
  },
  waveformContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  speakingStatus: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    letterSpacing: 0.2,
    marginTop: 8,
  },
  bottomDockWrapper: {
    width: '100%',
    paddingBottom: 8,
  },
  controlDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  dockButton: {
    alignItems: 'center',
    gap: 6,
  },
  btnCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCircleDefault: {
    backgroundColor: FluentColors.surfaceContainerLow,
  },
  btnCircleMuted: {
    backgroundColor: FluentColors.errorContainer,
  },
  btnCircleSpeakerActive: {
    backgroundColor: FluentColors.primaryFixed,
  },
  btnCircleEnd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: FluentColors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FluentColors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnLabel: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    fontWeight: '500',
  },
  icebreakerCard: {
    marginTop: 14,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '94%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
  },
  icebreakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  icebreakerHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: FluentColors.secondaryText,
  },
  partnerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  partnerMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FluentColors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  partnerMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.text,
  },
  partnerHobbiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  partnerHobbyTag: {
    backgroundColor: FluentColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  partnerHobbyTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: FluentColors.primary,
  },
});
