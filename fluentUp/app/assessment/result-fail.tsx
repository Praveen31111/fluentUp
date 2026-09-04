/**
 * FluentUp - Assessment Result (Gentle Guidance / Beginner Not Yet Ready) Screen
 * 
 * Flow:
 * 1. Agar user ka score B1 threshold se kam hota hai (A1/A2 foundation level)
 * 2. App user ko insult ya reject feel nahi karwata
 * 3. Constructive guidance: "Not quite yet. Keep practicing."
 * 4. Clear explanation: Speaking rooms need spontaneous conversational cadence
 * 5. Retake button taaki user dobara attempt kar sake
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

export default function AssessmentResultFailScreen() {
  const router = useRouter();
  const { resetAssessment } = useApp();

  const handleRetake = () => {
    resetAssessment();
    router.replace('/assessment' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Gentle Encouragement Icon Halo */}
        <View style={styles.haloSection}>
          <View style={styles.glowAura} />
          <View style={styles.haloCircle}>
            <MaterialIcons name="menu-book" size={34} color={FluentColors.primaryContainer} />
          </View>
        </View>

        {/* Heading Area */}
        <View style={styles.headingArea}>
          <Text style={styles.title}>Not quite yet.</Text>
          <Text style={styles.subtitle}>
            {"Your current result suggests you're still building your core English foundation."}
          </Text>
        </View>

        {/* Guidance Card */}
        <View style={styles.card}>
          <View style={styles.statusPill}>
            <MaterialIcons name="info-outline" size={14} color={FluentColors.secondaryText} />
            <Text style={styles.statusPillText}>Foundation Phase (A1 · A2)</Text>
          </View>

          <Text style={styles.cardBody}>
            Speaking rooms on FluentUp require spontaneous conversational flow so both practice partners get high-value speaking exchanges.
          </Text>

          <View style={styles.tipsBox}>
            <Text style={styles.tipsHeading}>Recommended next steps:</Text>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle-outline" size={16} color={FluentColors.primaryContainer} />
              <Text style={styles.tipText}>Listen to natural English podcasts or dialogue series</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle-outline" size={16} color={FluentColors.primaryContainer} />
              <Text style={styles.tipText}>Practice common spoken sentence transitions</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle-outline" size={16} color={FluentColors.primaryContainer} />
              <Text style={styles.tipText}>Retake the diagnostic to verify your peer eligibility</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.retakeBtn}
            onPress={handleRetake}
          >
            <MaterialIcons name="refresh" size={18} color={FluentColors.onPrimary} />
            <Text style={styles.retakeBtnText}>Try diagnostic again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.welcomeBtn}
            onPress={() => router.replace('/welcome')}
          >
            <Text style={styles.welcomeBtnText}>Back to Welcome</Text>
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
    paddingTop: 24,
    paddingBottom: 36,
  },
  haloSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  glowAura: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: FluentColors.surfaceContainerHigh,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 26,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: FluentColors.text,
    marginBottom: 18,
  },
  tipsBox: {
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  tipsHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.text,
    marginBottom: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    flex: 1,
  },
  actionSection: {
    gap: 12,
    alignItems: 'center',
  },
  retakeBtn: {
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
  retakeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  welcomeBtn: {
    paddingVertical: 8,
  },
  welcomeBtnText: {
    fontSize: 14,
    color: FluentColors.secondaryText,
  },
});
