/**
 * FluentUp - Assessment Result (PASS) Screen
 * 
 * Flow:
 * 1. User intermediate / advanced score achieve karta hai (B1/B2/C1)
 * 2. "You're ready. Your practice level has been calibrated."
 * 3. CEFR Level Hero Card: B2 Intermediate
 * 4. Micro-metrics: Speech Flow (84%), Pronunciation (91%)
 * 5. Primary CTA: "Continue to Home" -> unlocks full peer-to-peer matchmaking
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function AssessmentResultPassScreen() {
  const router = useRouter();
  const { user } = useApp();

  const level = user?.level || 'B2';
  const levelLabel = level === 'C1' ? 'Advanced' : level === 'B2' ? 'Intermediate' : 'Pre-Intermediate';

  const handleContinueToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Pulsing Success Halo Icon */}
        <View style={styles.haloSection}>
          <View style={styles.glowAura} />
          <View style={styles.haloCircle}>
            <MaterialIcons name="verified" size={36} color={FluentColors.tertiary} />
          </View>
        </View>

        {/* Editorial Heading */}
        <View style={styles.headingArea}>
          <Text style={styles.title}>{"You're ready."}</Text>
          <Text style={styles.subtitle}>Your practice level has been calibrated.</Text>
        </View>

        {/* CEFR Level Hero Card */}
        <View style={styles.heroCard}>
          {/* Top Gradient Accent Line */}
          <View style={styles.accentLine} />

          {/* Unlocked Room Pill */}
          <View style={styles.roomPill}>
            <View style={styles.pingDot} />
            <Text style={styles.roomPillText}>Speaking rooms unlocked</Text>
          </View>

          {/* Big CEFR Level Metric */}
          <Text style={styles.levelMetric}>{level}</Text>
          <Text style={styles.levelSublabel}>{levelLabel}</Text>

          {/* Benchmark Slider Track */}
          <View style={styles.trackContainer}>
            <View style={styles.trackLabels}>
              <Text style={styles.trackStep}>A1</Text>
              <Text style={styles.trackStep}>B1</Text>
              <Text style={[styles.trackStep, styles.trackStepActive]}>{level}</Text>
              <Text style={styles.trackStep}>C1</Text>
              <Text style={styles.trackStep}>C2</Text>
            </View>
            <View style={styles.trackBg}>
              <View style={[styles.trackFill, { width: level === 'C1' ? '85%' : '68%' }]} />
            </View>
          </View>

          {/* Narrative Inside Card */}
          <View style={styles.narrativeBox}>
            <MaterialIcons name="forum" size={20} color={FluentColors.primaryContainer} />
            <Text style={styles.narrativeText}>
              You can now practice with speakers at a similar level. Real conversations. No judgment.
            </Text>
          </View>
        </View>

        {/* Micro-Insight Metrics Bento */}
        <View style={styles.bentoRow}>
          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Speech Flow</Text>
              <MaterialIcons name="graphic-eq" size={16} color={FluentColors.secondaryText} />
            </View>
            <View style={styles.bentoStatRow}>
              <Text style={styles.bentoStatNumber}>84%</Text>
              <Text style={styles.bentoStatTag}>Natural</Text>
            </View>
          </View>

          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Pronunciation</Text>
              <MaterialIcons name="record-voice-over" size={16} color={FluentColors.secondaryText} />
            </View>
            <View style={styles.bentoStatRow}>
              <Text style={styles.bentoStatNumber}>91%</Text>
              <Text style={styles.bentoStatTag}>Clear</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.continueBtn}
            onPress={handleContinueToHome}
          >
            <Text style={styles.continueBtnText}>Continue to Home</Text>
            <MaterialIcons name="arrow-forward" size={18} color={FluentColors.onPrimary} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.retakeBtn}>
            <MaterialIcons name="schedule" size={16} color={FluentColors.secondaryText} />
            <Text style={styles.retakeText}>CEFR re-calibration cycle: 30 days</Text>
          </TouchableOpacity>
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
  container: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 36,
  },
  haloSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  glowAura: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: FluentColors.primaryFixed,
    opacity: 0.6,
  },
  haloCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headingArea: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: FluentColors.secondaryText,
  },
  heroCard: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: FluentColors.primaryContainer,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainer,
    marginBottom: 16,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  roomPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.tertiary,
  },
  levelMetric: {
    fontSize: 48,
    fontWeight: '800',
    color: FluentColors.text,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  levelSublabel: {
    fontSize: 14,
    fontWeight: '700',
    color: FluentColors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  trackContainer: {
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackStep: {
    fontSize: 11,
    fontWeight: '500',
    color: FluentColors.secondaryText,
  },
  trackStepActive: {
    color: FluentColors.primaryContainer,
    fontWeight: '700',
  },
  trackBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: FluentColors.primaryContainer,
  },
  narrativeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    width: '100%',
  },
  narrativeText: {
    fontSize: 13,
    color: FluentColors.text,
    lineHeight: 18,
    flex: 1,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bentoLabel: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  bentoStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bentoStatNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: FluentColors.text,
  },
  bentoStatTag: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.tertiary,
  },
  actionSection: {
    gap: 12,
    alignItems: 'center',
  },
  continueBtn: {
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
  continueBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  retakeText: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
});
