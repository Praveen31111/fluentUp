/**
 * FluentUp - User Profile & Practice Stats Screen
 * 
 * Flow:
 * 1. User ka CEFR calibrated profile display karta hai (Praveen Kumar · B2)
 * 2. Spoken metrics: Total sessions (12), weekly oral practice minutes (86 min)
 * 3. Most practiced conversation topic (Daily Routines & Urban Travel)
 * 4. Calibration cycles & Audio settings
 * 5. Sign out action
 */

import React from 'react';
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logoutUser } = useApp();

  const handleSignOut = () => {
    logoutUser();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={FluentColors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header Navigation */}
        <View style={styles.topHeader}>
          <TouchableOpacity activeOpacity={0.7} style={styles.navBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={FluentColors.text} />
          </TouchableOpacity>

          <View style={styles.calibratedTag}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>CALIBRATED PROFILE</Text>
          </View>

          <TouchableOpacity activeOpacity={0.7} style={styles.navBtn}>
            <MaterialIcons name="settings" size={20} color={FluentColors.text} />
          </TouchableOpacity>
        </View>

        {/* User Hero Portrait & Details */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
              }}
              style={styles.avatarLarge}
            />
            <View style={styles.verifiedCheck}>
              <MaterialIcons name="verified" size={16} color={FluentColors.onPrimary} />
            </View>
          </View>

          <Text style={styles.username}>{user?.username || 'Praveen Kumar'}</Text>

          {/* CEFR Level Tag */}
          <View style={styles.levelCapsule}>
            <View style={styles.levelTagDot} />
            <Text style={styles.levelText}>{user?.level || 'B2'} · Intermediate</Text>
            <Text style={styles.levelSub}>· Oral Diagnostic</Text>
          </View>

          <Text style={styles.focusText}>
            Focusing on conversational fluidity, nuance & spontaneous phrasing.
          </Text>
        </View>

        {/* Spoken Practice Metrics Bento */}
        <View style={styles.sectionArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>PRACTICE METRICS</Text>
            <View style={styles.lowStressPill}>
              <MaterialIcons name="insights" size={13} color={FluentColors.primaryContainer} />
              <Text style={styles.lowStressText}>Low-stress tracking</Text>
            </View>
          </View>

          {/* 2 Big Stat Cards */}
          <View style={styles.bentoStatsRow}>
            <View style={styles.bentoStatCard}>
              <View style={styles.bentoStatTop}>
                <Text style={styles.bentoStatTitle}>Completed</Text>
                <MaterialIcons name="forum" size={18} color={FluentColors.primaryContainer} />
              </View>
              <Text style={styles.bentoStatNumber}>{user?.totalSessions || 12}</Text>
              <Text style={styles.bentoStatLabel}>Spoken sessions</Text>
            </View>

            <View style={styles.bentoStatCard}>
              <View style={styles.bentoStatTop}>
                <Text style={styles.bentoStatTitle}>Weekly Total</Text>
                <MaterialIcons name="graphic-eq" size={18} color={FluentColors.tertiary} />
              </View>
              <Text style={styles.bentoStatNumber}>
                {user?.totalMinutes || 86}{' '}
                <Text style={styles.bentoStatUnit}>min</Text>
              </Text>
              <Text style={styles.bentoStatLabel}>Oral practice</Text>
            </View>
          </View>

          {/* Top Spoken Topic Card */}
          <View style={styles.topTopicCard}>
            <View style={styles.topicIconCircle}>
              <MaterialIcons name="explore" size={24} color={FluentColors.primary} />
            </View>
            <View style={styles.topicDetails}>
              <View style={styles.topicTopRow}>
                <Text style={styles.topicLabel}>TOP SPOKEN TOPIC</Text>
                <Text style={styles.topicRatio}>68% ratio</Text>
              </View>
              <Text style={styles.topicTitle}>{user?.topTopic || 'Daily Routines & Urban Travel'}</Text>
            </View>
          </View>
        </View>

        {/* Practice Calibration Setting */}
        <View style={styles.sectionArea}>
          <Text style={styles.sectionHeading}>PRACTICE CALIBRATION</Text>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <MaterialIcons name="timer" size={20} color={FluentColors.secondaryText} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Pacing target</Text>
                  <Text style={styles.menuSub}>Optimal 10–15 mins daily dialogue</Text>
                </View>
              </View>
              <Text style={styles.menuBadge}>12 min avg</Text>
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <MaterialIcons name="calendar-today" size={18} color={FluentColors.secondaryText} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>CEFR Calibration</Text>
                  <Text style={styles.menuSub}>Diagnostic review cycle</Text>
                </View>
              </View>
              <View style={styles.cycleBadge}>
                <Text style={styles.cycleBadgeText}>Next in 28 days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings & Preferences */}
        <View style={styles.sectionArea}>
          <Text style={styles.sectionHeading}>SETTINGS & PREFERENCES</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <MaterialIcons name="mic" size={20} color={FluentColors.secondaryText} />
                </View>
                <Text style={styles.menuTitle}>Audio & Microphone Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={FluentColors.secondaryText} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <MaterialIcons name="shield" size={20} color={FluentColors.secondaryText} />
                </View>
                <Text style={styles.menuTitle}>Privacy & Blocked Users</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={FluentColors.secondaryText} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Sign Out Action */}
            <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={handleSignOut}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconBg, { backgroundColor: FluentColors.errorContainer }]}>
                  <MaterialIcons name="logout" size={18} color={FluentColors.error} />
                </View>
                <Text style={[styles.menuTitle, { color: FluentColors.error }]}>Sign out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security / Engine Footer */}
        <Text style={styles.footerBrand}>
          FluentUp Oral Engine v2.4 · Encrypted Sessions
        </Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FluentColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  calibratedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: FluentColors.secondaryText,
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: 26,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    position: 'relative',
    marginBottom: 14,
  },
  avatarLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  verifiedCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FluentColors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FluentColors.surfaceLowest,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: FluentColors.text,
    marginBottom: 8,
  },
  levelCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: FluentColors.surfaceContainerLow,
    marginBottom: 10,
  },
  levelTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FluentColors.tertiary,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: FluentColors.text,
  },
  levelSub: {
    fontSize: 12,
    color: FluentColors.secondaryText,
  },
  focusText: {
    fontSize: 13,
    lineHeight: 18,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    maxWidth: 280,
  },
  sectionArea: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: FluentColors.secondaryText,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  lowStressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lowStressText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.primaryContainer,
  },
  bentoStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bentoStatCard: {
    flex: 1,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bentoStatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoStatTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.secondaryText,
  },
  bentoStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: FluentColors.text,
    letterSpacing: -0.5,
  },
  bentoStatUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: FluentColors.secondaryText,
  },
  bentoStatLabel: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginTop: 4,
  },
  topTopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topicIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FluentColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicDetails: {
    flex: 1,
  },
  topicTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: FluentColors.secondaryText,
  },
  topicRatio: {
    fontSize: 11,
    fontWeight: '600',
    color: FluentColors.tertiary,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: FluentColors.text,
  },
  menuGroup: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FluentColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: FluentColors.text,
  },
  menuSub: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginTop: 2,
  },
  menuBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.primaryContainer,
  },
  menuDivider: {
    height: 1,
    backgroundColor: FluentColors.surfaceContainerLow,
    marginHorizontal: 16,
  },
  cycleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: FluentColors.surfaceContainer,
  },
  cycleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  footerBrand: {
    fontSize: 11,
    color: FluentColors.secondaryText,
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.7,
  },
});
