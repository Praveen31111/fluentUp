/**
 * FluentUp - Partner Found (3..2..1 Countdown) Transition Screen
 * 
 * Flow:
 * 1. Match hone ke baad user ko visual context aur partner ki profile milti hai
 * 2. Alex Rivera (B2 Intermediate · Madrid, Spain)
 * 3. Shared conversation topic: "Coffee culture & daily morning routines"
 * 4. 3.. 2.. 1.. tactile countdown timer
 * 5. Countdown khatam hone par seedhe active audio room (/call) mein entry
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function PartnerFoundScreen() {
  const router = useRouter();
  const { activePartner } = useApp();

  // 3-second countdown state
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      // Countdown complete -> Enter live audio call
      router.replace('/call');
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <View style={styles.container}>
        {/* Top Status Capsule */}
        <View style={styles.badgePill}>
          <View style={styles.pingDot} />
          <Text style={styles.badgeText}>PARTNER FOUND</Text>
        </View>

        {/* Partner Card Hub */}
        <View style={styles.partnerHub}>
          {/* Avatar with living halo ring */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarAura} />
            <View style={styles.avatarBorder}>
              <Image
                source={{
                  uri:
                    (activePartner?.avatar &&
                      (activePartner.avatar.startsWith('http') || activePartner.avatar.startsWith('data:image/')))
                      ? activePartner.avatar
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                }}
                style={styles.avatarImg}
              />
            </View>

            {/* Verified indicator badge */}
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color={FluentColors.tertiary} />
            </View>
          </View>

          {/* Partner Name & Fluency Badge */}
          <Text style={styles.partnerName}>{activePartner?.name || 'Speaking Partner'}</Text>
          <View style={styles.levelCapsule}>
            <Text style={styles.levelCode}>{activePartner?.level?.split(' ')[0] || 'C1'}</Text>
            <Text style={styles.levelDivider}>•</Text>
            <Text style={styles.levelDesc}>Fluent Speaker</Text>
          </View>

          {/* Location & Education Info */}
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={15} color={FluentColors.primary} />
            <Text style={styles.locationText}>
              {activePartner?.address || activePartner?.location || 'Live Online'}
            </Text>
            {activePartner?.education ? (
              <>
                <Text style={styles.locationText}>•</Text>
                <MaterialIcons name="school" size={15} color={FluentColors.tertiary} />
                <Text style={styles.locationText}>{activePartner.education}</Text>
              </>
            ) : null}
          </View>

          {/* Partner Hobbies Tags */}
          {activePartner?.hobbies && activePartner.hobbies.length > 0 ? (
            <View style={styles.partnerHobbiesWrap}>
              {activePartner.hobbies.slice(0, 4).map((h, i) => (
                <View key={i} style={styles.partnerHobbyTag}>
                  <Text style={styles.partnerHobbyTagText}>{h}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Common Ground / Shared Conversation Starter */}
          <View style={styles.topicCard}>
            <View style={styles.topicIconCircle}>
              <MaterialIcons name="forum" size={18} color={FluentColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.topicLabel}>SHARED TOPIC</Text>
              <Text style={styles.topicName}>
                {activePartner?.sharedTopic || 'Conversations & everyday life'}
              </Text>
            </View>
          </View>
        </View>

        {/* Countdown & Microphone Pre-flight Status */}
        <View style={styles.countdownSection}>
          <Text style={styles.startingLabel}>Starting conversation in</Text>

          {/* Big Tactile Countdown Number */}
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNum}>{countdown > 0 ? countdown : 1}</Text>
          </View>

          {/* Audio Ready Pill */}
          <View style={styles.readyPill}>
            <View style={styles.readyDot} />
            <MaterialIcons name="mic" size={15} color={FluentColors.tertiary} />
            <Text style={styles.readyText}>Microphone & audio ready</Text>
          </View>
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
    paddingVertical: 24,
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FluentColors.tertiaryFixed,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: FluentColors.onTertiaryFixed,
  },
  partnerHub: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginVertical: 'auto',
  },
  avatarContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatarAura: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: FluentColors.primaryFixed,
    opacity: 0.5,
  },
  avatarBorder: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 3,
    backgroundColor: FluentColors.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  partnerName: {
    fontSize: 26,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  levelCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainer,
    marginBottom: 8,
  },
  levelCode: {
    fontSize: 13,
    fontWeight: '700',
    color: FluentColors.primaryContainer,
  },
  levelDivider: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  levelDesc: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topicIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FluentColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: FluentColors.secondaryText,
    marginBottom: 2,
  },
  topicName: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.text,
  },
  countdownSection: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  startingLabel: {
    fontSize: 14,
    color: FluentColors.secondaryText,
  },
  countdownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: FluentColors.primaryContainer,
    shadowColor: FluentColors.primaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  countdownNum: {
    fontSize: 26,
    fontWeight: '800',
    color: FluentColors.primaryContainer,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.secondaryText,
  },
  partnerHobbiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  partnerHobbyTag: {
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
  },
  partnerHobbyTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: FluentColors.text,
  },
});
