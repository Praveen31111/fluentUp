/**
 * FluentUp - Welcome Screen
 * 
 * First impression screen:
 * - Brand wordmark logo
 * - Living organic soundwave rhythm
 * - High-impact calm typography: "Real conversations. Better English."
 * - Primary CTA: "Get started" -> Auth screen
 * - Secondary link: "Already a member? Sign in"
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';

export default function WelcomeScreen() {
  const router = useRouter(); // Expo Router navigation hook

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />
      
      <View style={styles.container}>
        {/* Top Header: Brand Identity */}
        <View style={styles.header}>
          <BrandLogo size="large" withCapsule={true} />
        </View>

        {/* Center Hero Area: Typography & Living Soundwave */}
        <View style={styles.heroSection}>
          {/* Tagline Kicker Pill */}
          <View style={styles.kickerPill}>
            <View style={styles.kickerDot} />
            <Text style={styles.kickerText}>SPEAK</Text>
          </View>

          {/* Main Editorial Headline */}
          <Text style={styles.headline}>
            Real conversations.{'\n'}
            <Text style={styles.highlightText}>Better English.</Text>
          </Text>

          {/* Minimalist Living Voice Soundwave */}
          <View style={styles.waveformWrapper}>
            <WaveformVisualizer barCount={7} activeColor={FluentColors.primaryContainer} isSpeaking={true} />
          </View>

          {/* Calm Body Subtext */}
          <Text style={styles.subtext}>
            Find someone. Speak English.{'\n'}
            Get better naturally.
          </Text>
        </View>

        {/* Social Proof Pill */}
        <View style={styles.socialProofPill}>
          <View style={styles.avatarOverlap}>
            <View style={[styles.miniAvatar, { backgroundColor: '#E0E0E0' }]}>
              <Text style={styles.avatarLabel}>ES</Text>
            </View>
            <View style={[styles.miniAvatar, { backgroundColor: FluentColors.primaryFixed, marginLeft: -6 }]}>
              <Text style={[styles.avatarLabel, { color: FluentColors.primary }]}>JP</Text>
            </View>
            <View style={[styles.miniAvatar, { backgroundColor: '#C8E6C9', marginLeft: -6 }]}>
              <Text style={[styles.avatarLabel, { color: FluentColors.tertiary }]}>BR</Text>
            </View>
          </View>
          <Text style={styles.socialProofText}>Active learners speaking right now</Text>
        </View>

        {/* Bottom Interactive Actions */}
        <View style={styles.bottomSection}>
          {/* Primary Action: Get started */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryBtn}
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
            <MaterialIcons name="arrow-forward" size={18} color={FluentColors.onPrimary} />
          </TouchableOpacity>

          {/* Secondary Action: Sign in */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.secondaryLink}
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })}
          >
            <Text style={styles.secondaryLinkText}>
              Already a member? <Text style={styles.secondaryLinkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
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
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(229, 226, 225, 0.6)',
    marginBottom: 20,
  },
  kickerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: FluentColors.tertiary,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: FluentColors.secondaryText,
  },
  headline: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1,
    color: FluentColors.text,
    textAlign: 'center',
  },
  highlightText: {
    color: FluentColors.primaryContainer,
  },
  waveformWrapper: {
    marginVertical: 28,
  },
  subtext: {
    fontSize: 17,
    lineHeight: 26,
    color: FluentColors.secondaryText,
    textAlign: 'center',
  },
  socialProofPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 999,
    alignSelf: 'center',
  },
  avatarOverlap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: FluentColors.background,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: FluentColors.text,
  },
  socialProofText: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    fontWeight: '500',
  },
  bottomSection: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
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
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
    letterSpacing: -0.2,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLinkText: {
    fontSize: 14,
    color: FluentColors.secondaryText,
  },
  secondaryLinkBold: {
    fontWeight: '600',
    color: FluentColors.text,
  },
});
