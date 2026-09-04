/**
 * FluentUp - 30-Second Intelligent Matchmaking Screen
 * 
 * Algorithm & Architecture:
 * 0–10 sec: Exact level match (e.g. B2 <-> B2)
 * 10–20 sec: Adjacent level match (e.g. B1 <-> B2 or B2 <-> C1)
 * 20–30 sec: Wider compatible range ("Expanding matching range...")
 * 30 sec: No match / Retry option
 * 
 * Simulated Match:
 * User ko realistic feel dene ke liye ~6-8s par partner match hota hai aur
 * Partner Found transition screen (3..2..1) par route kiya jata hai.
 */

import React, { useEffect } from 'react';
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
import { useApp } from '@/context/AppContext';

export default function MatchmakingScreen() {
  const router = useRouter();
  const {
    user,
    isMatchmaking,
    matchmakingTime,
    cancelMatchmaking,
    startMatchmaking,
    activePartner,
  } = useApp();

  // Cancel finding partner and return to Home
  const handleCancel = () => {
    cancelMatchmaking();
    router.back();
  };

  // Real backend match found: Route to 3..2..1 Partner Found countdown
  useEffect(() => {
    if (activePartner && activePartner.roomName) {
      router.replace('/partner-found');
    }
  }, [activePartner]);

  const isTimedOut = matchmakingTime >= 30 && !activePartner;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <View style={styles.container}>
        {/* Top Matchmaking Pill & Header */}
        <View style={styles.topSection}>
          <View style={styles.badgePill}>
            <View style={[styles.pingDot, isTimedOut && { backgroundColor: FluentColors.warning }]} />
            <Text style={styles.badgeText}>
              {isTimedOut ? 'QUEUE TIMED OUT' : 'REAL-TIME MATCHMAKING'}
            </Text>
          </View>

          <Text style={styles.title}>
            {isTimedOut ? 'No partner found right now' : 'Finding your partner'}
          </Text>
          <Text style={styles.subtitle}>
            {isTimedOut
              ? 'Try again in a few moments or expand your practice filter.'
              : 'Looking for an online partner at your English fluency level.'}
          </Text>
        </View>

        {/* Center Radar / Waveform Hub */}
        <View style={styles.radarHub}>
          {/* Animated Glow Rings */}
          <View style={styles.outerGlowRing} />
          <View style={styles.middleGlowRing} />

          {/* Central Floating Orb */}
          <View style={styles.centerOrb}>
            <WaveformVisualizer
              barCount={7}
              activeColor={isTimedOut ? FluentColors.warning : FluentColors.primaryContainer}
              isSpeaking={!isTimedOut}
            />

            <View style={styles.timerRow}>
              <MaterialIcons name="schedule" size={15} color={FluentColors.secondaryText} />
              <Text style={styles.timerText}>{matchmakingTime}s</Text>
            </View>
          </View>

          {/* Orbiting Partner Teasers */}
          <View style={styles.orbitAvatarTop}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
              }}
              style={styles.orbitImg}
            />
          </View>

          <View style={styles.orbitAvatarBottom}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              }}
              style={styles.orbitImg}
            />
          </View>
        </View>

        {/* Bottom Level Indicator & Range Expansion Alert */}
        <View style={styles.bottomSection}>
          <View style={styles.levelRangeCapsule}>
            <MaterialIcons name="tune" size={16} color={FluentColors.tertiary} />
            <Text style={styles.levelRangeText}>
              Searching within {user?.level || 'C1'} · Advanced & Fluent
            </Text>
          </View>

          {/* Dynamic Expansion Notice */}
          <Text style={[styles.expansionNotice, { opacity: 1 }]}>
            {isTimedOut
              ? 'No learners matched within 30 seconds. Tap below to retry.'
              : matchmakingTime >= 20
              ? 'Expanding matching radar to all compatible English levels...'
              : matchmakingTime >= 10
              ? 'Scanning adjacent CEFR tiers for available peers...'
              : 'Connecting with live online learners...'}
          </Text>

          {/* Action Buttons */}
          {isTimedOut ? (
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.cancelBtn, { flex: 1 }]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.cancelBtn, { flex: 1, backgroundColor: FluentColors.primaryContainer }]}
                onPress={() => startMatchmaking()}
              >
                <Text style={[styles.cancelBtnText, { color: FluentColors.onPrimary }]}>
                  Retry Search
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.88} style={styles.cancelBtn} onPress={handleCancel}>
              <MaterialIcons name="close" size={20} color={FluentColors.secondaryText} />
              <Text style={styles.cancelBtnText}>Cancel Search</Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainerHigh,
    marginBottom: 14,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.primaryContainer,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: FluentColors.secondaryText,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: FluentColors.secondaryText,
    textAlign: 'center',
  },
  radarHub: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 'auto',
  },
  outerGlowRing: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(91, 92, 226, 0.05)',
  },
  middleGlowRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(91, 92, 226, 0.08)',
  },
  centerOrb: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FluentColors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    gap: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: FluentColors.text,
  },
  orbitAvatarTop: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FluentColors.surfaceLowest,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orbitAvatarBottom: {
    position: 'absolute',
    bottom: 12,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FluentColors.surfaceLowest,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orbitImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  levelRangeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainerLow,
  },
  levelRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.text,
  },
  expansionNotice: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
    opacity: 0.6,
  },
  cancelBtn: {
    width: '100%',
    height: 52,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
});
