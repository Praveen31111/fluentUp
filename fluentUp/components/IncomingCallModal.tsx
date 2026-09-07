/**
 * FluentUp - Incoming Direct Call Modal
 * 
 * Jab koi friend aapko direct Audio ya Video call karta hai,
 * yeh modal screen par ring/alert karta hai.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';

export interface IncomingCallData {
  caller: {
    id: string;
    name: string;
    photoUrl?: string;
    level?: string;
  };
  roomName: string;
  mode: 'audio' | 'video';
  callerSocketId: string;
}

interface IncomingCallModalProps {
  visible: boolean;
  callData: IncomingCallData | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  callData,
  onAccept,
  onDecline,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (visible) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [visible]);

  if (!callData) return null;

  const isVideo = callData.mode === 'video';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Call Mode Pill */}
          <View style={styles.modePill}>
            <MaterialIcons
              name={isVideo ? 'videocam' : 'mic'}
              size={16}
              color={FluentColors.primaryContainer}
            />
            <Text style={styles.modeText}>
              {isVideo ? 'Incoming Video Call' : 'Incoming Voice Call'}
            </Text>
          </View>

          {/* Caller Avatar with Pulse Halo */}
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.pulseHalo,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            {callData.caller.photoUrl ? (
              <Image
                source={{ uri: callData.caller.photoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {callData.caller.name ? callData.caller.name[0].toUpperCase() : 'F'}
                </Text>
              </View>
            )}
          </View>

          {/* Caller Name & Level Badge */}
          <Text style={styles.callerName}>{callData.caller.name || 'Speaking Friend'}</Text>
          {callData.caller.level && (
            <View style={styles.levelBadge}>
              <View style={styles.levelDot} />
              <Text style={styles.levelText}>{callData.caller.level} Fluency</Text>
            </View>
          )}

          <Text style={styles.ringingText}>is calling you directly...</Text>

          {/* Action Buttons: Accept & Decline */}
          <View style={styles.buttonRow}>
            {/* Decline Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.declineBtn}
              onPress={onDecline}
            >
              <MaterialIcons name="call-end" size={26} color="#FFFFFF" />
              <Text style={styles.btnLabel}>Decline</Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.acceptBtn}
              onPress={onAccept}
            >
              <MaterialIcons
                name={isVideo ? 'videocam' : 'call'}
                size={26}
                color="#FFFFFF"
              />
              <Text style={styles.btnLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    marginBottom: 24,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: FluentColors.primaryContainer,
    letterSpacing: 0.2,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseHalo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(103, 80, 164, 0.18)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: FluentColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callerName: {
    fontSize: 22,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  ringingText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  declineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnLabel: {
    position: 'absolute',
    bottom: -22,
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
});
