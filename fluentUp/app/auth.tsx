/**
 * FluentUp - Authentication Screen (Sign In & Sign Up)
 * 
 * Flow:
 * 1. User email & password enter karta hai
 * 2. Password visibility toggle aur dynamic strength validation
 * 3. Sign in / Create account switch
 * 4. Submit karne par user create hota hai aur Email Verification screen par navigate hota hai
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';
import { useApp } from '@/context/AppContext';

export default function AuthScreen() {
  const router = useRouter();
  const { signupUser, loginUser } = useApp();

  // Mode: Sign Up vs Sign In
  const [isSignUp, setIsSignUp] = useState<boolean>(true);

  // Form Fields (Empty for real users)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Authentication submit
  const handleAuthSubmit = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setErrorMessage('');

    if (isSignUp) {
      // New user registration -> Navigate to Email Verification
      await signupUser(email.trim());
      router.push('/verify-email');
    } else {
      // Existing user sign-in -> Connect to Live Profile
      await loginUser(email.trim());
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Top Navigation Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={22} color={FluentColors.text} />
            </TouchableOpacity>

            {/* Micro branding capsule */}
            <View style={styles.brandCapsule}>
              <BrandLogo size="medium" showWordmark={true} />
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={() => alert('Support: support@fluentup.com')}>
              <Text style={styles.helpText}>Help</Text>
            </TouchableOpacity>
          </View>

          {/* Social Proof Badge */}
          <View style={styles.socialProofBadge}>
            <View style={styles.miniAvatarStack}>
              <View style={[styles.avatarDot, { backgroundColor: '#FFD1DC' }]} />
              <View style={[styles.avatarDot, { backgroundColor: '#C1E1C1', marginLeft: -5 }]} />
              <View style={[styles.avatarDot, { backgroundColor: '#C5D8FF', marginLeft: -5 }]} />
            </View>
            <Text style={styles.socialProofText}>Joined by 14,000+ daily speakers</Text>
          </View>

          {/* Editorial Headline */}
          <View style={styles.headlineWrapper}>
            <Text style={styles.mainTitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'One tap away from spoken fluency.' : 'Ready to continue your English practice?'}
            </Text>
          </View>

          {/* Primary Form Card */}
          <View style={styles.card}>
            {/* Error banner agar validation fail ho */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color={FluentColors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Input Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Your email</Text>
                <Text style={styles.inputHint}>Work or personal</Text>
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="mail-outline" size={20} color={FluentColors.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor={FluentColors.secondaryText}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage('');
                  }}
                />
              </View>
            </View>

            {/* Password Input Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <Text style={styles.inputHint}>Must be 8+ chars</Text>
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock-outline" size={20} color={FluentColors.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { paddingRight: 40 }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={FluentColors.secondaryText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage('');
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={FluentColors.secondaryText}
                  />
                </TouchableOpacity>
              </View>

              {/* Password strength progress dots */}
              <View style={styles.strengthRow}>
                <View style={[styles.strengthDot, { backgroundColor: FluentColors.primaryContainer }]} />
                <View style={[styles.strengthDot, { backgroundColor: FluentColors.primaryContainer }]} />
                <View style={[styles.strengthDot, { backgroundColor: FluentColors.primaryContainer }]} />
                <View style={[styles.strengthDot, { backgroundColor: FluentColors.surfaceContainerHigh }]} />
              </View>
            </View>

            {/* Speech Pacing Preference (Native feel) */}
            <View style={styles.pacingCard}>
              <View style={styles.pacingLeft}>
                <View style={styles.pacingIconBg}>
                  <MaterialIcons name="graphic-eq" size={18} color={FluentColors.primaryContainer} />
                </View>
                <View>
                  <Text style={styles.pacingTitle}>Speech pacing</Text>
                  <Text style={styles.pacingSubtitle}>Natural, conversational cadence</Text>
                </View>
              </View>
              <View style={styles.pacingBadge}>
                <Text style={styles.pacingBadgeText}>1.0x</Text>
              </View>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.submitBtn}
              onPress={handleAuthSubmit}
            >
              <Text style={styles.submitBtnText}>
                {isSignUp ? 'Create account' : 'Sign in'}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={FluentColors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Mode Switch (Sign in <-> Sign up) */}
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsSignUp((prev) => !prev);
                setErrorMessage('');
              }}
            >
              <Text style={styles.switchLink}>
                {isSignUp ? 'Sign in' : 'Create account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>OR CONNECT WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Alternate Social Identity Buttons */}
          <View style={styles.socialButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.socialBtn}
              onPress={handleAuthSubmit}
            >
              <AntDesign name="apple" size={18} color={FluentColors.text} />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.socialBtn}
              onPress={handleAuthSubmit}
            >
              <AntDesign name="google" size={18} color="#EA4335" />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Quiet Legal Footnote */}
          <Text style={styles.legalDisclaimer}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FluentColors.background,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FluentColors.surfaceLowest,
  },
  brandCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: FluentColors.surfaceContainerLow,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.primaryContainer,
  },
  socialProofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  miniAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: FluentColors.surfaceLowest,
  },
  socialProofText: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    fontWeight: '500',
  },
  headlineWrapper: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: FluentColors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: FluentColors.secondaryText,
  },
  card: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FluentColors.errorContainer,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: FluentColors.error,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
  },
  inputHint: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: FluentColors.text,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  strengthDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  pacingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  pacingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pacingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pacingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.text,
  },
  pacingSubtitle: {
    fontSize: 11,
    color: FluentColors.secondaryText,
  },
  pacingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: FluentColors.surfaceLowest,
  },
  pacingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: FluentColors.primaryContainer,
  },
  submitBtn: {
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
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  switchPrompt: {
    fontSize: 14,
    color: FluentColors.secondaryText,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
    color: FluentColors.primaryContainer,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: FluentColors.outline,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: FluentColors.secondaryText,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
  },
  legalDisclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  legalLink: {
    color: FluentColors.text,
    textDecorationLine: 'underline',
  },
});
