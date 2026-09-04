/**
 * FluentUp - Email Verification Screen
 * 
 * Flow:
 * 1. User ko email confirmation link bheja gaya hai batata hai
 * 2. 45s countdown resend cooldown timer
 * 3. "Open email app" action
 * 4. Value unlock breakdown (Voice Analysis, Live Partners, CEFR Certificate)
 * 5. Instant verification continue button -> Assessment Intro
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';
import { useApp } from '@/context/AppContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, verifyEmail } = useApp();

  // 45s resend cooldown timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(45);
  const [resendSent, setResendSent] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [secondsLeft]);

  // Resend email handler
  const handleResend = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(45);
      setResendSent(true);
      setTimeout(() => setResendSent(false), 3000);
    }
  };

  // Open default mail app
  const handleOpenMail = () => {
    Linking.openURL('mailto:').catch(() => {
      alert('Could not launch mail client');
    });
  };

  // Continue to Assessment flow once verified
  const handleContinueToAssessment = () => {
    verifyEmail();
    router.push('/assessment/intro');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header with Brand Logo */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <BrandLogo size="medium" withCapsule={true} />
        </View>

        {/* Top Status Capsule */}
        <View style={styles.statusCapsuleWrapper}>
          <View style={styles.statusCapsule}>
            <MaterialIcons name="verified" size={15} color={FluentColors.tertiary} />
            <Text style={styles.statusText}>Email sent securely</Text>
          </View>
        </View>

        {/* Ambient Graphic / Hero Email Orb */}
        <View style={styles.heroOrbSection}>
          <View style={styles.glowAura} />
          <View style={styles.orbCircle}>
            <View style={styles.innerAccentOrb}>
              <MaterialIcons name="mark-email-unread" size={36} color={FluentColors.primaryContainer} />
            </View>
            <View style={styles.sparkleBadge}>
              <MaterialIcons name="auto-awesome" size={18} color={FluentColors.primaryContainer} />
            </View>
          </View>
        </View>

        {/* Editorial Heading & User Email Badge */}
        <View style={styles.headlineArea}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>We sent a verification link to</Text>

          <View style={styles.emailBadge}>
            <MaterialIcons name="alternate-email" size={16} color={FluentColors.secondaryText} />
            <Text style={styles.emailText}>{user?.email || 'praveen@example.com'}</Text>
          </View>
        </View>

        {/* Value Unlock Card */}
        <View style={styles.valueCard}>
          <View style={styles.valueHeader}>
            <View style={styles.lockIconBox}>
              <MaterialIcons name="lock-open" size={20} color={FluentColors.primaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.valueTitle}>Unlock Full Access</Text>
              <Text style={styles.valueDescription}>
                Verify your email to unlock spoken assessment and peer matching.
              </Text>
            </View>
          </View>

          {/* Micro Perks Tags */}
          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <MaterialIcons name="mic" size={18} color={FluentColors.tertiary} />
              <Text style={styles.perkLabel}>Voice Analysis</Text>
            </View>

            <View style={styles.perkDivider} />

            <View style={styles.perkItem}>
              <MaterialIcons name="group" size={18} color={FluentColors.primaryContainer} />
              <Text style={styles.perkLabel}>Live Partners</Text>
            </View>

            <View style={styles.perkDivider} />

            <View style={styles.perkItem}>
              <MaterialIcons name="workspace-premium" size={18} color={FluentColors.tertiary} />
              <Text style={styles.perkLabel}>CEFR Level</Text>
            </View>
          </View>
        </View>

        {/* Primary and Verification Actions */}
        <View style={styles.actionSection}>
          {/* Primary Action 1: Open email app */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.openMailBtn}
            onPress={handleOpenMail}
          >
            <Text style={styles.openMailText}>Open email app</Text>
            <MaterialIcons name="open-in-new" size={18} color={FluentColors.onPrimary} />
          </TouchableOpacity>

          {/* Primary Action 2: Continue (Simulating link clicked) */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.continueVerifiedBtn}
            onPress={handleContinueToAssessment}
          >
            <MaterialIcons name="check-circle" size={18} color={FluentColors.tertiary} />
            <Text style={styles.continueVerifiedText}>{"I've verified my email (Continue)"}</Text>
          </TouchableOpacity>

          {/* Resend link countdown */}
          <View style={styles.resendArea}>
            <Text style={styles.resendPrompt}>{"Didn't receive it?"}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={secondsLeft > 0}
              onPress={handleResend}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendBtnText, secondsLeft === 0 && styles.resendActiveText]}>
                {secondsLeft > 0 ? `Resend link in ${secondsLeft}s` : 'Resend link now'}
              </Text>
            </TouchableOpacity>

            {resendSent && (
              <Text style={styles.feedbackToast}>Fresh link sent! Please check your spam folder.</Text>
            )}
          </View>

          {/* Help Center */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.helpLink}
            onPress={() => alert('Support: support@fluentup.com')}
          >
            <Text style={styles.helpLinkText}>Need help or used the wrong email?</Text>
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
    paddingTop: 16,
    paddingBottom: 36,
  },
  statusCapsuleWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainerLow,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.secondaryText,
  },
  heroOrbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  glowAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: FluentColors.primaryFixed,
    opacity: 0.7,
  },
  orbCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  innerAccentOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(225, 221, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headlineArea: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: FluentColors.secondaryText,
    marginBottom: 12,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: FluentColors.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
  },
  valueCard: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 26,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  lockIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: FluentColors.text,
  },
  valueDescription: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    marginTop: 2,
    lineHeight: 18,
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: FluentColors.surfaceContainerLow,
    paddingTop: 14,
  },
  perkItem: {
    alignItems: 'center',
    gap: 4,
  },
  perkLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: FluentColors.secondaryText,
  },
  perkDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: FluentColors.outline,
  },
  actionSection: {
    gap: 12,
  },
  openMailBtn: {
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
  openMailText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  continueVerifiedBtn: {
    width: '100%',
    height: 52,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: FluentColors.outline,
  },
  continueVerifiedText: {
    fontSize: 15,
    fontWeight: '600',
    color: FluentColors.text,
  },
  resendArea: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  resendPrompt: {
    fontSize: 13,
    color: FluentColors.secondaryText,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  resendActiveText: {
    color: FluentColors.primaryContainer,
  },
  feedbackToast: {
    fontSize: 12,
    color: FluentColors.tertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  helpLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  helpLinkText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    textDecorationLine: 'underline',
  },
});
