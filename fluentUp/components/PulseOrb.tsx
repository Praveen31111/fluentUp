/**
 * FluentUp - Pulse Orb Component
 * 
 * Yeh component Home screen aur Matchmaking screen par concentric animated radar aura create karta hai.
 * FluentUp ke calm, physical feel ko promote karta hai.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';

interface PulseOrbProps {
  size?: number;             // Center orb diameter
  iconName?: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  isPulsing?: boolean;
}

export const PulseOrb: React.FC<PulseOrbProps> = ({
  size = 68,
  iconName = 'mic',
  onPress,
  isPulsing = true,
}) => {
  // Animation value for expanding outer ring
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isPulsing) {
      // Loopable gentle breath / radar pulse animation
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isPulsing]);

  // Outer ring scale from 1.0 to 1.6
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });

  // Outer ring opacity from 0.5 fading to 0
  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 0.2, 0],
  });

  return (
    <View style={[styles.wrapper, { width: size * 1.8, height: size * 1.8 }]}>
      {/* Dynamic Animated Pulse Aura */}
      {isPulsing && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size * 1.25,
              height: size * 1.25,
              borderRadius: (size * 1.25) / 2,
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
      )}

      {/* Static Inner Halo Ring */}
      <View
        style={[
          styles.innerHalo,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
          },
        ]}
      />

      {/* Main Core Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        disabled={!onPress}
        style={[
          styles.coreOrb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <MaterialIcons name={iconName} size={size * 0.48} color={FluentColors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Animated expanding radar wave
  pulseRing: {
    position: 'absolute',
    backgroundColor: FluentColors.primaryFixed,
  },
  // Soft ambient static background circle
  innerHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(225, 221, 255, 0.45)',
  },
  // Center tactile action circle
  coreOrb: {
    backgroundColor: FluentColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FluentColors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
