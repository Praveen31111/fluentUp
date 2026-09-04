/**
 * FluentUp - Entry Gatekeeper Screen
 * 
 * Yeh component app launch hone par check karta hai:
 * 1. Kya user logged in hai?
 * 2. Kya user ki email verified hai?
 * 3. Kya user ka English assessment approved hai?
 * 
 * Uske hisaab se correct initial screen par automatically route karta hai.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FluentColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function IndexGatekeeper() {
  const router = useRouter();
  const { user, isAuthenticated } = useApp();

  useEffect(() => {
    // Check authentication and onboarding status
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        // Not logged in -> Welcome screen
        router.replace('/welcome');
      } else if (!user.isEmailVerified) {
        // Email pending -> Email verification
        router.replace('/verify-email');
      } else if (user.status === 'PENDING') {
        // Assessment pending -> Assessment Intro
        router.replace('/assessment/intro');
      } else if (user.status === 'REJECTED') {
        // Foundation level -> Result Fail Guidance
        router.replace('/assessment/result-fail');
      } else {
        // Approved user -> Direct to Home practice dashboard
        router.replace('/(tabs)');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={FluentColors.primaryContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FluentColors.background,
  },
});
