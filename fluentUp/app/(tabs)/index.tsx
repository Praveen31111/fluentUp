/**
 * FluentUp - Hero Home Screen
 * 
 * Core Philosophy:
 * "Find someone. Speak English. Get better."
 * Zero clutter, no distracting news feed, no social media vanity metrics.
 * 
 * Features:
 * 1. User fluency level badge (B2 · Intermediate)
 * 2. Real-time active learners count (42 online)
 * 3. Hero CTA: "Find a partner" with living microphone PulseOrb
 * 4. Today's conversation topic & pacing target
 * 5. Low-stress oral practice progress tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';
import { PulseOrb } from '@/components/PulseOrb';
import { useApp } from '@/context/AppContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, startMatchmaking } = useApp();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Find Partner Action
  const handleFindPartner = () => {
    setIsConnecting(true);
    startMatchmaking();
    setTimeout(() => {
      setIsConnecting(false);
      router.push('/matchmaking');
    }, 450);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      {/* Top Header Bar */}
      <View style={styles.topNav}>
        <BrandLogo size="medium" />

        <View style={styles.topRightRow}>
          {/* Active Level Pill */}
          <View style={styles.levelBadge}>
            <View style={styles.levelDot} />
            <Text style={styles.levelBadgeText}>{user?.level || 'B2'} Fluency</Text>
          </View>

          {/* Profile Mini Avatar */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profileAvatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Image
              source={{
                uri: user?.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Presence Indicator Row */}
        <View style={styles.presenceRow}>
          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusPillText}>Ready to practice</Text>
            <View style={styles.smallDivider} />
            <Text style={styles.statusSubText}>{user?.level || 'B2'} · Active</Text>
          </View>

          <View style={styles.onlinePill}>
            <MaterialIcons name="graphic-eq" size={14} color={FluentColors.tertiary} />
            <Text style={styles.onlineText}>Speaking Now</Text>
          </View>
        </View>

        {/* Personalized Greeting */}
        <View style={styles.greetingArea}>
          <Text style={styles.greetingSub}>
            Good evening, {user?.username?.split(' ')[0] || 'Learner'}
          </Text>
          <Text style={styles.greetingMain}>Ready to speak?</Text>
        </View>

        {/* Hero Interactive Find Partner Card */}
        <View style={styles.heroCard}>
          {/* Center Living Pulse Orb */}
          <View style={styles.orbContainer}>
            <PulseOrb
              size={72}
              iconName="mic"
              isPulsing={true}
              onPress={handleFindPartner}
            />
          </View>

          {/* Value Promise */}
          <View style={styles.heroTextArea}>
            <Text style={styles.heroCardTitle}>Natural 1-on-1 Dialogue</Text>
            <Text style={styles.heroCardSubtitle}>
              Matched with speakers at your fluency pace. No judgment, just flow.
            </Text>
          </View>

          {/* Hero Action Button: "Find a partner" */}
          <View style={styles.heroButtonWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.findPartnerBtn, isConnecting && { opacity: 0.85 }]}
              onPress={handleFindPartner}
            >
              {isConnecting ? (
                <>
                  <MaterialIcons name="sync" size={20} color={FluentColors.onPrimary} />
                  <Text style={styles.findPartnerText}>Connecting to queue...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.findPartnerText}>Find a partner</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={FluentColors.onPrimary} />
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.heroCardFootnote}>One conversation at a time.</Text>
          </View>
        </View>

        {/* Quick Cues & Daily Target Bento */}
        <View style={styles.bentoRow}>
          {/* Daily Conversation Cue */}
          <View style={styles.bentoCard}>
            <View style={styles.bentoCardHeader}>
              <Text style={styles.bentoCardLabel}>{"Today's Topic"}</Text>
              <MaterialIcons name="auto-stories" size={18} color={FluentColors.primaryContainer} />
            </View>
            <Text style={styles.bentoCardTitle}>Urban Travel</Text>
            <Text style={styles.bentoCardSub}>3 conversation cues</Text>
          </View>

          {/* Pacing Target */}
          <View style={styles.bentoCard}>
            <View style={styles.bentoCardHeader}>
              <Text style={styles.bentoCardLabel}>Pacing Target</Text>
              <MaterialIcons name="timer" size={18} color={FluentColors.tertiary} />
            </View>
            <Text style={styles.bentoCardTitle}>10–15 min</Text>
            <Text style={[styles.bentoCardSub, { color: FluentColors.tertiary }]}>
              Comfortable cadence
            </Text>
          </View>
        </View>

        {/* Spoken Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <View style={styles.progressIconBox}>
              <MaterialIcons name="insights" size={22} color={FluentColors.primaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>
                {user?.totalSessions || 12} conversations completed
              </Text>
              <Text style={styles.progressSubtitle}>
                {user?.totalMinutes || 86} minutes spoken this week
              </Text>
            </View>
          </View>

          {/* Radial progress graphic ring */}
          <View style={styles.progressRing}>
            <MaterialIcons name="check" size={18} color={FluentColors.primaryContainer} />
          </View>
        </View>

        {/* Recent Partner Snippet */}
        <View style={styles.recentPartnerCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            }}
            style={styles.recentAvatar}
          />
          <View style={styles.recentContent}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentName}>Last spoke with Alex</Text>
              <View style={styles.recentDot} />
              <Text style={styles.recentTime}>Yesterday</Text>
            </View>
            <Text style={styles.recentQuote}>
              “Great cadence exploring daily morning routines.”
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FluentColors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: FluentColors.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: FluentColors.outline,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainer,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.text,
  },
  profileAvatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainerLow,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.text,
  },
  smallDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: FluentColors.secondaryText,
  },
  statusSubText: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainer,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  greetingArea: {
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 15,
    color: FluentColors.secondaryText,
    marginBottom: 2,
  },
  greetingMain: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: FluentColors.text,
  },
  heroCard: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 18,
  },
  orbContainer: {
    marginVertical: 10,
  },
  heroTextArea: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 12,
  },
  heroCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  heroCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    maxWidth: 260,
  },
  heroButtonWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  findPartnerBtn: {
    width: '100%',
    height: 54,
    backgroundColor: FluentColors.primaryContainer,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: FluentColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  findPartnerText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
    letterSpacing: -0.2,
  },
  heroCardFootnote: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bentoCardLabel: {
    fontSize: 11,
    color: FluentColors.secondaryText,
    fontWeight: '500',
  },
  bentoCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: FluentColors.text,
    marginBottom: 2,
  },
  bentoCardSub: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 16,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
  },
  progressSubtitle: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginTop: 2,
  },
  progressRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: FluentColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentPartnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
  },
  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  recentContent: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  recentName: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.text,
  },
  recentDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: FluentColors.secondaryText,
  },
  recentTime: {
    fontSize: 11,
    color: FluentColors.secondaryText,
  },
  recentQuote: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    lineHeight: 16,
  },
});
