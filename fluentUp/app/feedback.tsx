/**
 * FluentUp - Post-Conversation Feedback & Reflection Screen
 * 
 * Flow:
 * 1. Call wrap up hone ke baad user reflection time
 * 2. 5-star interactive conversation flow rating
 * 3. Single focused question: "Did your partner help you practice English?"
 * 4. Safety & Trust: Report user/partner option
 * 5. Primary action: "Done & back to Home" -> updates user spoken practice stats
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
import { useApp } from '@/context/AppContext';

export default function FeedbackScreen() {
  const router = useRouter();
  const { activePartner, saveFeedback, callDuration } = useApp();

  // Format seconds to MM:SS string
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1 to 5 Stars flow rating
  const [rating, setRating] = useState<number>(5);

  // Practice quality options
  const [practiceQuality, setPracticeQuality] = useState<string>('great');

  // Dynamic qualitative rating labels
  const ratingLabels = [
    'Hesitant or rushed',
    'A bit bumpy',
    'Pleasant exchange',
    'Very comfortable',
    'Effortless & engaging',
  ];

  // Save feedback and return to Home
  const handleDone = () => {
    saveFeedback(rating, practiceQuality);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Partner Micro Portrait & Status */}
        <View style={styles.headerArea}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarAura} />
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    activePartner?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                }}
                style={styles.avatarImg}
              />
              <View style={styles.checkBadge}>
                <MaterialIcons name="check" size={12} color={FluentColors.onPrimary} />
              </View>
            </View>
          </View>

          {/* Session Tag */}
          <View style={styles.sessionTag}>
            <MaterialIcons name="schedule" size={14} color={FluentColors.primaryContainer} />
            <Text style={styles.sessionTagText}>
              {formatDuration(callDuration || 0)} with {activePartner?.name || 'Speaking Partner'} · {activePartner?.level || 'Fluent'}
            </Text>
          </View>

          <Text style={styles.title}>Conversation ended</Text>
          <Text style={styles.subtitle}>
            A light moment to celebrate your practice. How did speaking today feel?
          </Text>
        </View>

        {/* 5-Star Interactive Rating Card */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>How was the conversation flow?</Text>
          <Text style={styles.ratingHint}>Natural exchanges, pacing, and mutual rhythm</Text>

          {/* 5 Interactive Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                activeOpacity={0.7}
                style={styles.starBtn}
                onPress={() => setRating(star)}
              >
                <MaterialIcons
                  name="star"
                  size={34}
                  color={star <= rating ? FluentColors.primaryContainer : FluentColors.surfaceContainerHigh}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingFeedbackLabel}>{ratingLabels[rating - 1]}</Text>
        </View>

        {/* Partner Practice Quality Question */}
        <View style={styles.qualitySection}>
          <Text style={styles.qualityHeading}>Did your partner help you practice English?</Text>

          <View style={styles.optionsStack}>
            {/* Option 1: Yes, great flow */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.qualityOption,
                practiceQuality === 'great' && styles.qualityOptionSelected,
              ]}
              onPress={() => setPracticeQuality('great')}
            >
              <View style={styles.qualityOptionLeft}>
                <View
                  style={[
                    styles.radioCircle,
                    practiceQuality === 'great' && styles.radioCircleSelected,
                  ]}
                >
                  {practiceQuality === 'great' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.qualityText}>Yes, great flow</Text>
              </View>
              <MaterialIcons name="sentiment-satisfied" size={20} color={FluentColors.primaryContainer} />
            </TouchableOpacity>

            {/* Option 2: Somewhat */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.qualityOption,
                practiceQuality === 'somewhat' && styles.qualityOptionSelected,
              ]}
              onPress={() => setPracticeQuality('somewhat')}
            >
              <View style={styles.qualityOptionLeft}>
                <View
                  style={[
                    styles.radioCircle,
                    practiceQuality === 'somewhat' && styles.radioCircleSelected,
                  ]}
                >
                  {practiceQuality === 'somewhat' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.qualityText}>Somewhat</Text>
              </View>
              <MaterialIcons name="sentiment-neutral" size={20} color={FluentColors.secondaryText} />
            </TouchableOpacity>

            {/* Option 3: No, didn't match well */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.qualityOption,
                practiceQuality === 'nomatch' && styles.qualityOptionSelected,
              ]}
              onPress={() => setPracticeQuality('nomatch')}
            >
              <View style={styles.qualityOptionLeft}>
                <View
                  style={[
                    styles.radioCircle,
                    practiceQuality === 'nomatch' && styles.radioCircleSelected,
                  ]}
                >
                  {practiceQuality === 'nomatch' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.qualityText}>{"No, didn't match well"}</Text>
              </View>
              <MaterialIcons name="sentiment-dissatisfied" size={20} color={FluentColors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety / Report Partner Link */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reportRow}
          onPress={() => alert('Report submitted. Our moderation team will review this session.')}
        >
          <MaterialIcons name="flag" size={16} color={FluentColors.secondaryText} />
          <Text style={styles.reportText}>Report an issue or partner</Text>
        </TouchableOpacity>

        {/* Primary Action Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity activeOpacity={0.9} style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Done & back to Home</Text>
            <MaterialIcons name="arrow-forward" size={18} color={FluentColors.onPrimary} />
          </TouchableOpacity>

          {/* Retention Hook */}
          <View style={styles.retentionBox}>
            <Text style={styles.retentionText}>
              Ready for another conversation?{' '}
              <Text style={styles.retentionLink} onPress={handleDone}>
                One tap to speak again.
              </Text>
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
  container: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerArea: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarSection: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  avatarAura: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: FluentColors.primaryFixed,
    opacity: 0.6,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FluentColors.surfaceLowest,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: FluentColors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: FluentColors.surfaceLowest,
  },
  sessionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainer,
    marginBottom: 12,
  },
  sessionTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.text,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    maxWidth: 280,
  },
  ratingCard: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  ratingPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: FluentColors.text,
    marginBottom: 4,
  },
  ratingHint: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  starBtn: {
    padding: 2,
  },
  ratingFeedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.primaryContainer,
  },
  qualitySection: {
    marginBottom: 18,
  },
  qualityHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: FluentColors.text,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  optionsStack: {
    gap: 10,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  qualityOptionSelected: {
    borderColor: FluentColors.primaryContainer,
    backgroundColor: 'rgba(225, 221, 255, 0.25)',
  },
  qualityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: FluentColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: FluentColors.primaryContainer,
    backgroundColor: FluentColors.primaryContainer,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.surfaceLowest,
  },
  qualityText: {
    fontSize: 15,
    fontWeight: '500',
    color: FluentColors.text,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 20,
  },
  reportText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
  },
  bottomSection: {
    gap: 12,
  },
  doneBtn: {
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
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  retentionBox: {
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  retentionText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
  },
  retentionLink: {
    color: FluentColors.primaryContainer,
    fontWeight: '600',
  },
});
