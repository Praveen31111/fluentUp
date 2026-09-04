/**
 * FluentUp Design Token System
 * 
 * Yeh design system Apple-level simplicity aur calm, focused aesthetics ko follow karta hai.
 * Unnecessary neon colors ya heavy gradients ki jagah refined neutral aur purposeful accent colors use kiye gaye hain.
 */

import { Platform } from 'react-native';

// FluentUp Official Color Palette
export const FluentColors = {
  // Background surfaces
  background: '#FAFAF8',         // Main app background (calm off-white)
  surface: '#FBF9F8',            // Screen card surface
  surfaceLowest: '#FFFFFF',      // Pure white for elevated cards
  surfaceContainer: '#EFEDED',   // Pill tags, subtle chips
  surfaceContainerLow: '#F5F3F3',// Low contrast card backgrounds
  surfaceContainerHigh: '#E9E8E7',// Dividers and slightly darker elements
  
  // Typography & Content
  text: '#111111',               // Primary text (deep dark gray, not harsh black)
  secondaryText: '#6B6B6B',      // Secondary explanatory text
  outline: '#E7E7E3',            // Subtle border color
  outlineVariant: '#C7C4D7',     // Slightly accented border

  // Accent & Brand Colors
  primary: '#4141C8',            // Deep focused indigo
  primaryContainer: '#5B5CE2',   // FluentUp signature primary CTA accent
  primaryFixed: '#E1DFFF',       // Soft pastel accent container
  onPrimary: '#FFFFFF',          // Text on primary buttons
  
  // Status Colors
  tertiary: '#22A06B',           // Success & connected indicator (vibrant emerald green)
  tertiaryContainer: '#007D50',  // Darker green
  tertiaryFixed: '#86F9BC',      // Light green tag background
  onTertiaryFixed: '#002112',    // Text on green tags
  warning: '#D97706',            // Amber warning / timeout accent
  warningContainer: '#FEF3C7',   // Muted amber background
  error: '#D64545',              // Destructive / End call button
  errorContainer: '#FFDAD6',     // Muted error red container
  onError: '#FFFFFF',            // White text on error button
};

// Expo default theme compatibility
export const Colors = {
  light: {
    text: FluentColors.text,
    background: FluentColors.background,
    tint: FluentColors.primaryContainer,
    icon: FluentColors.secondaryText,
    tabIconDefault: FluentColors.secondaryText,
    tabIconSelected: FluentColors.primaryContainer,
  },
  dark: {
    text: FluentColors.text,
    background: FluentColors.background,
    tint: FluentColors.primaryContainer,
    icon: FluentColors.secondaryText,
    tabIconDefault: FluentColors.secondaryText,
    tabIconSelected: FluentColors.primaryContainer,
  },
};

// Typography font hierarchy
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
