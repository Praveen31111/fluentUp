/**
 * FluentUp - English Diagnostic Assessment Screen
 * 
 * Flow:
 * 1. 8 questions step-by-step progress indicator
 * 2. 3 clean, natural sentence options
 * 3. Option select karne par tactile selection and active Continue button
 * 4. 8th question complete hone par score calculate hota hai
 * 5. Pass (B1/B2/C1) -> Result Pass screen; Fail (A1/A2) -> Result Fail screen
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

export default function AssessmentScreen() {
  const router = useRouter();
  const {
    questions,
    currentQuestionIndex,
    selectedAnswers,
    selectAnswer,
    nextQuestion,
    submitAssessment,
  } = useApp();

  const currentQ = questions[currentQuestionIndex];
  const selectedOption = selectedAnswers[currentQuestionIndex];
  const isOptionSelected = selectedOption !== undefined;

  // Handle continuing to next question or submitting
  const handleContinue = async () => {
    if (!isOptionSelected) return;

    const isFinished = nextQuestion();
    if (isFinished) {
      // All 8 questions completed -> evaluate score
      const result = await submitAssessment();
      if (result.passed) {
        router.replace('/assessment/result-pass');
      } else {
        router.replace('/assessment/result-fail');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Progress Tracker */}
        <View style={styles.progressHeader}>
          <View style={styles.counterRow}>
            <Text style={styles.diagnosticLabel}>DIAGNOSTIC</Text>
            <View style={styles.numbersRow}>
              <Text style={styles.currentNum}>
                {String(currentQuestionIndex + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.totalNum}> / 08</Text>
            </View>
          </View>

          {/* 8-Segment Progress Dots */}
          <View style={styles.progressBar}>
            {questions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  index <= currentQuestionIndex
                    ? { backgroundColor: FluentColors.primaryContainer }
                    : { backgroundColor: FluentColors.surfaceContainerHigh },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Question Header & Category Pill */}
        <View style={styles.questionSection}>
          <View style={styles.categoryPill}>
            <MaterialIcons name="graphic-eq" size={15} color={FluentColors.primaryContainer} />
            <Text style={styles.categoryText}>{currentQ.category}</Text>
          </View>

          <Text style={styles.questionPrompt}>{currentQ.prompt}</Text>
          <Text style={styles.questionInstruction}>{currentQ.instruction}</Text>
        </View>

        {/* Options Radio Stack */}
        <View style={styles.optionsList}>
          {currentQ.options.map((optionText, optIndex) => {
            const isSelected = selectedOption === optIndex;

            return (
              <TouchableOpacity
                key={optIndex}
                activeOpacity={0.85}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => selectAnswer(currentQuestionIndex, optIndex)}
              >
                <View style={styles.optionContent}>
                  {/* Indicator Dot / Checkmark */}
                  <View
                    style={[
                      styles.indicatorCircle,
                      isSelected && styles.indicatorCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color={FluentColors.onPrimary} />
                    )}
                  </View>

                  {/* Option Text */}
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {optionText}
                  </Text>
                </View>

                {/* Tactile Audio Listen Icon */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.audioListenBtn}
                  onPress={() => {
                    // Audio pronunciation preview
                  }}
                >
                  <MaterialIcons name="volume-up" size={18} color={FluentColors.secondaryText} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pedagogical Reassurance Box */}
        <View style={styles.reassuranceCard}>
          <View style={styles.timerIconBox}>
            <MaterialIcons name="timer" size={16} color={FluentColors.primaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reassuranceTitle}>
              Short 2-minute diagnostic to find your exact speaking peer level.
            </Text>
            <Text style={styles.reassuranceSubtitle}>
              Zero grading anxiety • Adapts in real-time
            </Text>
          </View>
        </View>

        {/* Action Bottom Section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!isOptionSelected}
            style={[
              styles.continueBtn,
              !isOptionSelected && styles.continueBtnDisabled,
            ]}
            onPress={handleContinue}
          >
            <Text
              style={[
                styles.continueBtnText,
                !isOptionSelected && styles.continueBtnTextDisabled,
              ]}
            >
              Continue
            </Text>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color={isOptionSelected ? FluentColors.onPrimary : FluentColors.secondaryText}
            />
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
  progressHeader: {
    marginBottom: 26,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diagnosticLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: FluentColors.secondaryText,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentNum: {
    fontSize: 15,
    fontWeight: '700',
    color: FluentColors.text,
  },
  totalNum: {
    fontSize: 13,
    color: FluentColors.secondaryText,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  questionSection: {
    marginBottom: 24,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  questionPrompt: {
    fontSize: 22,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 6,
  },
  questionInstruction: {
    fontSize: 14,
    color: FluentColors.secondaryText,
    lineHeight: 20,
  },
  optionsList: {
    gap: 12,
    marginBottom: 26,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: FluentColors.primaryContainer,
    backgroundColor: 'rgba(225, 221, 255, 0.15)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  indicatorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: FluentColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorCircleSelected: {
    borderColor: FluentColors.primaryContainer,
    backgroundColor: FluentColors.primaryContainer,
  },
  optionText: {
    fontSize: 15,
    lineHeight: 22,
    color: FluentColors.secondaryText,
    flex: 1,
  },
  optionTextSelected: {
    color: FluentColors.text,
    fontWeight: '600',
  },
  audioListenBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  timerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: FluentColors.text,
    lineHeight: 18,
  },
  reassuranceSubtitle: {
    fontSize: 11,
    color: FluentColors.secondaryText,
    marginTop: 2,
  },
  bottomSection: {
    width: '100%',
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
  continueBtnDisabled: {
    backgroundColor: FluentColors.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onPrimary,
  },
  continueBtnTextDisabled: {
    color: FluentColors.secondaryText,
  },
});
