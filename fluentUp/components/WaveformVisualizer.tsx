/**
 * FluentUp - Living Soundwave Visualizer Component
 * 
 * Yeh component speech rhythm aur voice activity ko visually represent karta hai.
 * Minimalist bars organically animate hote hain taaki screen lively aur responsive feel ho.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { FluentColors } from '@/constants/theme';

interface WaveformVisualizerProps {
  barCount?: number;        // Total bars (default: 7)
  activeColor?: string;     // Color of bars (default: #5B5CE2)
  isSpeaking?: boolean;     // Whether speech is active
  maxHeight?: number;       // Maximum bar height in px
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  barCount = 7,
  activeColor = FluentColors.primaryContainer,
  isSpeaking = true,
  maxHeight = 44,
}) => {
  // Base bar heights according to FluentUp soundwave design
  const defaultHeights = [12, 24, 40, 28, 44, 20, 10];

  // Animated values for each individual bar
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(1))
  ).current;

  useEffect(() => {
    let isMounted = true;

    // Har bar ke liye organic breathing animation loop
    const animateBars = () => {
      if (!isSpeaking || !isMounted) return;

      const animations = animatedValues.map((anim, index) => {
        // Random multiplier between 0.35 and 1.25 for organic human voice feel
        const randomScale = 0.35 + Math.random() * 0.9;
        return Animated.timing(anim, {
          toValue: randomScale,
          duration: 140 + (index % 3) * 60,
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start(() => {
        if (isMounted && isSpeaking) {
          animateBars();
        }
      });
    };

    animateBars();

    return () => {
      isMounted = false;
    };
  }, [isSpeaking]);

  return (
    <View style={styles.container}>
      {animatedValues.map((anim, index) => {
        const baseHeight = defaultHeights[index % defaultHeights.length];
        
        // Bar height dynamically calculated
        const barHeight = anim.interpolate({
          inputRange: [0, 1.5],
          outputRange: [6, Math.min(maxHeight, baseHeight * 1.3)],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: isSpeaking ? barHeight : 6,
                backgroundColor: activeColor,
                opacity: index === 0 || index === barCount - 1 ? 0.5 : 0.95,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container centered with even bar spacing
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 5,
  },
  // Individual rounded soundwave bar
  bar: {
    width: 4,
    borderRadius: 999,
  },
});
