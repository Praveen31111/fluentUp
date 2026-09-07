/**
 * FluentUp - Root Layout & Global Navigation Hub
 * 
 * Yeh file poore application ka root layout hai:
 * 1. Global AppProvider inject karta hai (State, Auth, Call, Assessment data)
 * 2. FluentUp ke sabhi primary routes register karta hai:
 *    - Welcome Screen
 *    - Auth Screen (Sign in / Sign up)
 *    - Email Verification Screen
 *    - Assessment flow (Intro, Questions, Pass, Fail)
 *    - Tabs (Home, Profile)
 *    - 30s Matchmaking
 *    - Partner Found (3..2..1)
 *    - Live Audio Call & End Call Sheet
 *    - Post-Call Feedback
 */

import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AppProvider, useApp } from '@/context/AppContext';
import { IncomingCallModal } from '@/components/IncomingCallModal';

function NavigationWithIncomingCall() {
  const router = useRouter();
  const { incomingCall, acceptIncomingCall, declineIncomingCall } = useApp();

  const handleAccept = () => {
    acceptIncomingCall();
    router.push('/call');
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#FAFAF8' },
        }}
      >
        {/* 0. Gatekeeper Entry Route */}
        <Stack.Screen name="index" />

        {/* 1. First Welcome Screen */}
        <Stack.Screen name="welcome" />

        {/* 2. Authentication Screen */}
        <Stack.Screen name="auth" />

        {/* 3. Email Verification */}
        <Stack.Screen name="verify-email" />

        {/* 4. Assessment Gating Flow */}
        <Stack.Screen name="assessment/intro" />
        <Stack.Screen name="assessment/index" />
        <Stack.Screen name="assessment/result-pass" />
        <Stack.Screen name="assessment/result-fail" />

        {/* 5. Main App Tabs (Home, Friends & Profile) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 6. Matchmaking & Real-time Partner Matching */}
        <Stack.Screen name="matchmaking" />
        <Stack.Screen name="partner-found" />

        {/* 7. Active Audio Conversation & Safe Exit Sheet */}
        <Stack.Screen name="call" />

        {/* 8. Session Feedback & Reflection */}
        <Stack.Screen name="feedback" />
      </Stack>

      <IncomingCallModal
        visible={!!incomingCall}
        callData={incomingCall}
        onAccept={handleAccept}
        onDecline={declineIncomingCall}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <NavigationWithIncomingCall />
    </AppProvider>
  );
}
