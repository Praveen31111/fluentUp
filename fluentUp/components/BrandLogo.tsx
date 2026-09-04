/**
 * FluentUp - Brand Logo & Wordmark Component
 * 
 * Yeh component FluentUp ka signature voice spark icon aur typographic wordmark render karta hai.
 * Safe areas aur alag-alag screen sizes ke liye scale adjustments ke sath designed hai
 * taaki logo har screen par bilkul clear, bold aur crisp dikhe.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FluentColors } from '@/constants/theme';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showWordmark?: boolean;
  withCapsule?: boolean; // Agar capsule pill background ke sath dikhana ho
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'medium',
  showWordmark = true,
  withCapsule = false,
}) => {
  // Dimension multipliers based on selected size
  const isSmall = size === 'small';
  const isLarge = size === 'large';
  const scale = isSmall ? 0.8 : isLarge ? 1.3 : 1.0;

  const content = (
    <View style={[styles.container, { gap: 8 * scale }]}>
      {/* 5-Bar Signature Voice Waveform Emblem */}
      <View style={[styles.iconContainer, { height: 32 * scale, gap: 3.5 * scale }]}>
        <View style={[styles.bar, { width: 3.8 * scale, height: 12 * scale, opacity: 0.6 }]} />
        <View style={[styles.bar, { width: 3.8 * scale, height: 22 * scale, opacity: 0.9 }]} />
        <View
          style={[
            styles.bar,
            {
              width: 3.8 * scale,
              height: 30 * scale,
              opacity: 1.0,
              backgroundColor: FluentColors.primary,
            },
          ]}
        />
        <View style={[styles.bar, { width: 3.8 * scale, height: 18 * scale, opacity: 0.9 }]} />
        <View style={[styles.bar, { width: 3.8 * scale, height: 8 * scale, opacity: 0.6 }]} />
      </View>

      {/* Typography Wordmark: "FluentUp" with primary-container accent on "Up" */}
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: 22 * scale }]}>
          Fluent
          <Text style={{ color: FluentColors.primaryContainer }}>Up</Text>
        </Text>
      )}
    </View>
  );

  if (withCapsule) {
    return <View style={styles.capsuleWrapper}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Icon container holding the vertical sound bars
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Voice spark bars with smooth rounded pills
  bar: {
    borderRadius: 999,
    backgroundColor: FluentColors.primaryContainer,
  },
  // Clean modern wordmark with sharp letter spacing
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.7,
    color: FluentColors.text,
  },
  // Optional elevated container for headers
  capsuleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: FluentColors.outline,
  },
});
