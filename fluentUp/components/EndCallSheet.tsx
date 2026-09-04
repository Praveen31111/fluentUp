/**
 * FluentUp - End Call Confirmation Modal Sheet
 * 
 * Yeh component call ke dauran accidental tap se bachata hai.
 * User ko clear digest batata hai (spoken time, partner name) aur do clear options deta hai:
 * 1. "Keep talking" (Dismiss)
 * 2. "End conversation" (Confirm end & go to Feedback)
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';

interface EndCallSheetProps {
  visible: boolean;
  partnerName: string;
  durationText: string;
  onKeepTalking: () => void;
  onConfirmEnd: () => void;
}

export const EndCallSheet: React.FC<EndCallSheetProps> = ({
  visible,
  partnerName,
  durationText,
  onKeepTalking,
  onConfirmEnd,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepTalking}
    >
      {/* Dim Ambient Backdrop Overlay */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onKeepTalking}
        />

        {/* Central Confirmation Card */}
        <View style={styles.sheetCard}>
          {/* Subtle Sheet Handle indicator */}
          <View style={styles.dragHandle} />

          {/* Icon Badge: Friendly Waving Hand */}
          <View style={styles.iconCircle}>
            <MaterialIcons name="waving-hand" size={30} color={FluentColors.primaryContainer} />
          </View>

          {/* Heading */}
          <Text style={styles.title}>End conversation?</Text>

          {/* Conversational Explanation */}
          <Text style={styles.subtitle}>
            {"You've been practicing with "}<Text style={styles.boldText}>{partnerName}</Text>{" for "}
            <Text style={styles.boldText}>{durationText}</Text>{". Leaving now will wrap up today's session."}
          </Text>

          {/* Mini Session Digest Card */}
          <View style={styles.digestCard}>
            <View style={styles.digestItem}>
              <View style={[styles.digestIconCircle, { backgroundColor: FluentColors.primaryFixed }]}>
                <MaterialIcons name="record-voice-over" size={18} color={FluentColors.primary} />
              </View>
              <View>
                <Text style={styles.digestLabel}>Spoken</Text>
                <Text style={styles.digestValue}>4.2 min</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.digestItem}>
              <View style={[styles.digestIconCircle, { backgroundColor: '#D5F5E3' }]}>
                <MaterialIcons name="psychology" size={18} color={FluentColors.tertiary} />
              </View>
              <View>
                <Text style={styles.digestLabel}>Phrases</Text>
                <Text style={styles.digestValue}>6 saved</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Stack */}
          <View style={styles.buttonStack}>
            {/* 1. Primary retention: Keep talking */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.keepTalkingBtn}
              onPress={onKeepTalking}
            >
              <MaterialIcons name="mic" size={20} color={FluentColors.primaryContainer} />
              <Text style={styles.keepTalkingText}>Keep talking</Text>
            </TouchableOpacity>

            {/* 2. Destructive action: End conversation */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.endCallBtn}
              onPress={onConfirmEnd}
            >
              <MaterialIcons name="call-end" size={20} color={FluentColors.onError} />
              <Text style={styles.endCallText}>End conversation</Text>
            </TouchableOpacity>
          </View>

          {/* Low-stress reassurance footer */}
          <Text style={styles.footerNote}>
            Your streak and session notes are saved automatically
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: FluentColors.surfaceContainerHigh,
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: '600',
    color: FluentColors.text,
  },
  digestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: FluentColors.surfaceContainerLow,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  digestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  digestIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digestLabel: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  digestValue: {
    fontSize: 15,
    fontWeight: '700',
    color: FluentColors.text,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: FluentColors.outline,
  },
  buttonStack: {
    width: '100%',
    gap: 10,
  },
  keepTalkingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    backgroundColor: FluentColors.surfaceContainerLow,
    gap: 8,
  },
  keepTalkingText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.text,
  },
  endCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    backgroundColor: FluentColors.error,
    gap: 8,
  },
  endCallText: {
    fontSize: 16,
    fontWeight: '600',
    color: FluentColors.onError,
  },
  footerNote: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginTop: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});
