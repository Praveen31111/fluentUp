/**
 * FluentUp - English Assessment Intro Screen
 * 
 * Flow:
 * 1. User ko gentle pedagogical guidance deta hai
 * 2. "Let's check your English"
 * 3. 8 questions ~2 minutes duration
 * 4. "This isn't an intimidating exam; it's simply finding your speaking peers."
 * 5. Primary CTA: "Start assessment"
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function AssessmentIntroScreen() {
  const router = useRouter();
  const { resetAssessment } = useApp();

  const handleStart = () => {
    resetAssessment();
    router.push('/assessment' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <View style={styles.container}>
        {/* Top Bar with subtle back button */}
        <View style={styles.topBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={FluentColors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Diagnostic Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Visual Icon */}
        <View style={styles.heroSection}>
          <View style={styles.iconAura}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="psychology" size={40} color={FluentColors.primaryContainer} />
            </View>
          </View>

          {/* Heading and Narrative */}
          <Text style={styles.headline}>{"Let's check your English"}</Text>
          <Text style={styles.description}>
            A short diagnostic helps us match you with compatible speaking partners at your natural pace.
          </Text>

          {/* 3 Benefit Pills */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <MaterialIcons name="quiz" size={20} color={FluentColors.primaryContainer} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>8 quick questions</Text>
                <Text style={styles.infoSubtitle}>Takes ~2 minutes to complete</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: '#E8F8F0' }]}>
                <MaterialIcons name="speed" size={20} color={FluentColors.tertiary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Zero grading pressure</Text>
                <Text style={styles.infoSubtitle}>Evaluates conversational rhythm, not tricky theory</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: FluentColors.primaryFixed }]}>
                <MaterialIcons name="forum" size={20} color={FluentColors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Instant speaking room unlock</Text>
                <Text style={styles.infoSubtitle}>Intermediate & Advanced learners join immediately</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom CTA Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity activeOpacity={0.9} style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Start assessment</Text>
            <MaterialIcons name="arrow-forward" size={20} color={FluentColors.onPrimary} />
          </TouchableOpacity>

          <Text style={styles.footnote}>
            This simply finds your practice level. You can retake it anytime.
          </Text>
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
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FluentColors.surfaceLowest,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: FluentColors.text,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  iconAura: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: FluentColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  infoCard: {
    width: '100%',
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
  },
  infoSubtitle: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: FluentColors.surfaceContainerLow,
  },
  bottomSection: {
    width: '100%',
    gap: 12,
  },
  startBtn: {
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
    elevation: 3,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  footnote: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    textAlign: 'center',
  },
});
