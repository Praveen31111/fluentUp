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

export default function CallScreen() {
  const router = useRouter();
  const {
    user,
    activePartner,
    callDuration,
    isMuted,
    isSpeakerOn,
    toggleMute,
    toggleSpeaker,
    endCall,
  } = useApp();

  // End Call confirmation sheet visibility
  const [showEndSheet, setShowEndSheet] = useState<boolean>(false);
  const [isPartnerMuted, setIsPartnerMuted] = useState<boolean>(false);

  // Format seconds to MM:SS string
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Initialize WebRTC Hardware Microphone & P2P Stream
  React.useEffect(() => {
    async function setupAudio() {
      if (activePartner?.roomName && user?.id) {
        // Ensure active socket signaling room connection
        callSocketService.joinRoom(
          activePartner.roomName,
          user.id,
          user.username || 'Learner',
        );

        // Deterministic role: smaller ID acts as offerer (caller)
        const isCaller = user.id < (activePartner.id || '');
        await webrtcService.initializeCall(activePartner.roomName, isCaller);
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

  // 3. Sync speaker state (Loudspeaker vs Earpiece)
  React.useEffect(() => {
    webrtcService.setSpeaker(isSpeakerOn);
  }, [isSpeakerOn]);

  // 3. Socket event listeners for real-time room sync
  React.useEffect(() => {
    callSocketService.onPartnerMuteStatus((data) => {
      setIsPartnerMuted(data.isMuted);
    });

    callSocketService.onCallEnded((data) => {
      console.log('Call ended remotely by partner:', data);
      webrtcService.cleanup();
      router.replace('/feedback');
    });
  }, [router]);

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
                    activePartner?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
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
          <Text style={styles.partnerName}>{activePartner?.name || 'Speaking Partner'}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLang}>English</Text>
            <View style={styles.levelDividerDot} />
            <Text style={styles.levelCode}>{activePartner?.level || 'C1 · Fluent'}</Text>
          </View>

          {/* Minimal Living Voice Waveform */}
          <View style={styles.waveformContainer}>
            <WaveformVisualizer
              barCount={11}
              activeColor={FluentColors.primaryContainer}
              isSpeaking={!isPartnerMuted && !isMuted}
            />
          </View>
          <Text style={styles.speakingStatus}>
            {isMuted
              ? 'Your microphone is muted'
              : isPartnerMuted
              ? `${activePartner?.name || 'Partner'} is currently muted`
              : `${activePartner?.name || 'Partner'} is speaking...`}
          </Text>

          {/* Partner Icebreaker Card (Address, Education, Hobbies) */}
          <View style={styles.icebreakerCard}>
            <View style={styles.icebreakerHeader}>
              <MaterialIcons name="lightbulb" size={14} color={FluentColors.primary} />
              <Text style={styles.icebreakerHeaderTitle}>PARTNER CONTEXT & HOBBIES</Text>
            </View>

            {/* Address & Education */}
            <View style={styles.partnerMetaRow}>
              {activePartner?.address ? (
                <View style={styles.partnerMetaPill}>
                  <MaterialIcons name="location-on" size={13} color={FluentColors.primary} />
                  <Text style={styles.partnerMetaText}>{activePartner.address}</Text>
                </View>
              ) : null}

              {activePartner?.education ? (
                <View style={styles.partnerMetaPill}>
                  <MaterialIcons name="school" size={13} color={FluentColors.tertiary} />
                  <Text style={styles.partnerMetaText}>{activePartner.education}</Text>
                </View>
              ) : null}
            </View>

            {/* Hobbies chips */}
            {activePartner?.hobbies && activePartner.hobbies.length > 0 ? (
              <View style={styles.partnerHobbiesWrap}>
                {activePartner.hobbies.slice(0, 4).map((h, i) => (
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

            {/* 2. Speaker Toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dockButton}
              onPress={toggleSpeaker}
            >
              <View
                style={[
                  styles.btnCircle,
                  isSpeakerOn ? styles.btnCircleSpeakerActive : styles.btnCircleDefault,
                ]}
              >
                <MaterialIcons
                  name={isSpeakerOn ? 'volume-up' : 'hearing'}
                  size={24}
                  color={isSpeakerOn ? FluentColors.primaryContainer : FluentColors.secondaryText}
                />
              </View>
              <Text style={styles.btnLabel}>Speaker</Text>
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
          partnerName={activePartner?.name || 'Alex'}
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
