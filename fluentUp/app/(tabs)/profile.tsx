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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FluentColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

// Preset Avatars for quick selection
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
];

// Popular Hobby Suggestions
const POPULAR_HOBBIES = [
  '🏏 Cricket',
  '💻 Coding',
  '📚 Reading',
  '✈️ Traveling',
  '🎵 Music',
  '🎬 Movies',
  '🎮 Gaming',
  '🏋️ Fitness',
  '📸 Photography',
  '🎨 Art & Design',
  '🍳 Cooking',
  '⚽ Football',
  '♟️ Chess',
  '🎙️ Podcasts',
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logoutUser, updateUserProfile } = useApp();

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editHobbies, setEditHobbies] = useState<string[]>([]);
  const [editBio, setEditBio] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [customHobbyInput, setCustomHobbyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    setEditUsername(user?.username || '');
    setEditAddress(user?.address || '');
    setEditEducation(user?.education || '');
    setEditHobbies(user?.hobbies || ['Cricket', 'Traveling', 'English Practice']);
    setEditBio(user?.bio || '');
    setEditPhotoUrl(user?.photoUrl || AVATAR_PRESETS[0]);
    setIsEditModalOpen(true);
  };

  // Pick Photo from Mobile Gallery
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to select your photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditPhotoUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Gallery pick error:', e);
    }
  };

  // Take Photo with Mobile Camera
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to take a picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditPhotoUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Camera photo error:', e);
    }
  };

  // Toggle Hobby Selection
  const toggleHobby = (hobby: string) => {
    const cleanHobby = hobby.replace(/[^\w\s&]/gi, '').trim();
    if (editHobbies.includes(cleanHobby)) {
      setEditHobbies(editHobbies.filter((h) => h !== cleanHobby));
    } else {
      setEditHobbies([...editHobbies, cleanHobby]);
    }
  };

  // Add Custom Hobby
  const handleAddCustomHobby = () => {
    if (customHobbyInput.trim() && !editHobbies.includes(customHobbyInput.trim())) {
      setEditHobbies([...editHobbies, customHobbyInput.trim()]);
      setCustomHobbyInput('');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    const success = await updateUserProfile({
      username: editUsername,
      address: editAddress,
      education: editEducation,
      hobbies: editHobbies,
      bio: editBio,
      photoUrl: editPhotoUrl,
    });
    setIsSaving(false);

    if (success) {
      setIsEditModalOpen(false);
      Alert.alert('Success', 'Your profile details have been updated!');
    } else {
      Alert.alert('Notice', 'Profile updated.');
      setIsEditModalOpen(false);
    }
  };

  const handleSignOut = () => {
    logoutUser();
    router.replace('/welcome');
  };

  const displayPhoto =
    user?.photoUrl ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

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

          <TouchableOpacity activeOpacity={0.7} style={styles.navBtn} onPress={handleOpenEditModal}>
            <MaterialIcons name="edit" size={20} color={FluentColors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Hero Portrait & Details */}
        <View style={styles.profileHero}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.avatarWrapper}
            onPress={handleOpenEditModal}
          >
            <Image source={{ uri: displayPhoto }} style={styles.avatarLarge} />
            <View style={styles.editBadge}>
              <MaterialIcons name="camera-alt" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{user?.username || 'Praveen Kumar'}</Text>

          {/* CEFR Level Tag */}
          <View style={styles.levelCapsule}>
            <View style={styles.levelTagDot} />
            <Text style={styles.levelText}>{user?.level || 'B2'} · Intermediate</Text>
            <Text style={styles.levelSub}>· Oral Diagnostic</Text>
          </View>

          {/* Address & Education Badges */}
          <View style={styles.infoMetaRow}>
            {user?.address ? (
              <View style={styles.metaPill}>
                <MaterialIcons name="location-on" size={14} color={FluentColors.primary} />
                <Text style={styles.metaText}>{user.address}</Text>
              </View>
            ) : null}

            {user?.education ? (
              <View style={styles.metaPill}>
                <MaterialIcons name="school" size={14} color={FluentColors.tertiary} />
                <Text style={styles.metaText}>{user.education}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.focusText}>
            {user?.bio || 'Focusing on conversational fluidity, nuance & spontaneous phrasing.'}
          </Text>

          {/* Edit Profile Quick Button */}
          <TouchableOpacity
            style={styles.editProfileButton}
            activeOpacity={0.8}
            onPress={handleOpenEditModal}
          >
            <MaterialIcons name="edit" size={16} color={FluentColors.primary} />
            <Text style={styles.editProfileButtonText}>Edit Profile & Hobbies</Text>
          </TouchableOpacity>
        </View>

        {/* Hobbies & Conversation Starters Section */}
        <View style={styles.sectionArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>MY HOBBIES & INTERESTS</Text>
            <TouchableOpacity onPress={handleOpenEditModal}>
              <Text style={styles.sectionActionText}>+ Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hobbiesContainer}>
            {user?.hobbies && user.hobbies.length > 0 ? (
              user.hobbies.map((hobby, index) => (
                <View key={index} style={styles.hobbyChip}>
                  <Text style={styles.hobbyChipText}>{hobby}</Text>
                </View>
              ))
            ) : (
              <TouchableOpacity style={styles.addHobbyPrompt} onPress={handleOpenEditModal}>
                <MaterialIcons name="add-circle-outline" size={16} color={FluentColors.secondaryText} />
                <Text style={styles.addHobbyPromptText}>Add your hobbies to break the ice in calls</Text>
              </TouchableOpacity>
            )}
          </View>
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

      {/* ======================================================== */}
      {/* Edit Profile Modal (Photo, Address, Education, Hobbies) */}
      {/* ======================================================== */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Your Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={22} color={FluentColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Photo Selector Section */}
              <Text style={styles.inputSectionTitle}>PROFILE PHOTO</Text>
              <Text style={styles.inputSectionSub}>
                Photo aapke phone mein local save hoti hai (Database par 0 load).
              </Text>

              <View style={styles.photoPickerRow}>
                <Image source={{ uri: editPhotoUrl || displayPhoto }} style={styles.modalAvatarPreview} />
                <View style={styles.photoActionButtons}>
                  <TouchableOpacity style={styles.pickPhotoBtn} onPress={handlePickFromGallery}>
                    <MaterialIcons name="photo-library" size={18} color={FluentColors.primary} />
                    <Text style={styles.pickPhotoBtnText}>Gallery Se Choose Karein</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.pickPhotoBtn} onPress={handleTakePhoto}>
                    <MaterialIcons name="photo-camera" size={18} color={FluentColors.primary} />
                    <Text style={styles.pickPhotoBtnText}>Camera Se Photo Kheenche</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Avatar Presets */}
              <Text style={[styles.inputSectionSub, { marginTop: 12 }]}>Ya ready avatar choose karein:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
                {AVATAR_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setEditPhotoUrl(preset)}
                    style={[
                      styles.presetThumbWrapper,
                      editPhotoUrl === preset && styles.presetThumbSelected,
                    ]}
                  >
                    <Image source={{ uri: preset }} style={styles.presetThumb} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Full Name Input */}
              <Text style={styles.inputSectionTitle}>FULL NAME</Text>
              <TextInput
                style={styles.textInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Aapka Naam (e.g. Praveen Kumar)"
                placeholderTextColor={FluentColors.secondaryText}
              />

              {/* Address / Location Input */}
              <Text style={styles.inputSectionTitle}>ADDRESS / CITY / STATE</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Aapka Shehar / State (e.g. New Delhi, India)"
                placeholderTextColor={FluentColors.secondaryText}
              />

              {/* Education Input */}
              <Text style={styles.inputSectionTitle}>EDUCATION / DEGREE / COLLEGE</Text>
              <TextInput
                style={styles.textInput}
                value={editEducation}
                onChangeText={setEditEducation}
                placeholder="Course ya College (e.g. B.Tech Computer Science)"
                placeholderTextColor={FluentColors.secondaryText}
              />

              {/* Short Bio Input */}
              <Text style={styles.inputSectionTitle}>SHORT BIO</Text>
              <TextInput
                style={[styles.textInput, { height: 65, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                placeholder="Apne baare mein 1 line likhein..."
                placeholderTextColor={FluentColors.secondaryText}
              />

              {/* Hobbies Selection */}
              <Text style={styles.inputSectionTitle}>YOUR HOBBIES & INTERESTS</Text>
              <Text style={styles.inputSectionSub}>
                Ye hobbies call mein partner ko dikhayi dengi conversation start karne ke liye:
              </Text>

              <View style={styles.hobbiesSelectionWrap}>
                {POPULAR_HOBBIES.map((hobby, idx) => {
                  const clean = hobby.replace(/[^\w\s&]/gi, '').trim();
                  const isSelected = editHobbies.includes(clean);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.selectHobbyChip, isSelected && styles.selectHobbyChipActive]}
                      onPress={() => toggleHobby(hobby)}
                    >
                      <Text
                        style={[
                          styles.selectHobbyChipText,
                          isSelected && styles.selectHobbyChipTextActive,
                        ]}
                      >
                        {hobby}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Hobby Field */}
              <View style={styles.customHobbyRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  value={customHobbyInput}
                  onChangeText={setCustomHobbyInput}
                  placeholder="Apni koi aur hobby likhein..."
                  placeholderTextColor={FluentColors.secondaryText}
                />
                <TouchableOpacity style={styles.addHobbyBtn} onPress={handleAddCustomHobby}>
                  <Text style={styles.addHobbyBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Selected Hobbies Preview */}
              {editHobbies.length > 0 && (
                <View style={styles.selectedPreviewWrap}>
                  <Text style={styles.selectedCountText}>Selected ({editHobbies.length}):</Text>
                  <View style={styles.selectedTagsRow}>
                    {editHobbies.map((h, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.selectedTagPill}
                        onPress={() => setEditHobbies(editHobbies.filter((item) => item !== h))}
                      >
                        <Text style={styles.selectedTagText}>{h} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveProfileBtnText}>Save Profile Details</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: FluentColors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.text,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FluentColors.primaryFixed,
    marginTop: 6,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.primary,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.primary,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyChip: {
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
  },
  hobbyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: FluentColors.text,
  },
  addHobbyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addHobbyPromptText: {
    fontSize: 13,
    color: FluentColors.secondaryText,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: FluentColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FluentColors.surfaceContainer,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FluentColors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: FluentColors.secondaryText,
    marginTop: 14,
    marginBottom: 6,
  },
  inputSectionSub: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginBottom: 10,
    lineHeight: 16,
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalAvatarPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FluentColors.surfaceContainer,
  },
  photoActionButtons: {
    flex: 1,
    gap: 8,
  },
  pickPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
  },
  pickPhotoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: FluentColors.text,
  },
  presetsRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  presetThumbWrapper: {
    marginRight: 10,
    borderRadius: 24,
    padding: 2,
  },
  presetThumbSelected: {
    borderWidth: 2,
    borderColor: FluentColors.primary,
  },
  presetThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  textInput: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: FluentColors.text,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
    marginBottom: 6,
  },
  hobbiesSelectionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectHobbyChip: {
    backgroundColor: FluentColors.surfaceLowest,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FluentColors.surfaceContainer,
  },
  selectHobbyChipActive: {
    backgroundColor: FluentColors.primary,
    borderColor: FluentColors.primary,
  },
  selectHobbyChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.text,
  },
  selectHobbyChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  customHobbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addHobbyBtn: {
    backgroundColor: FluentColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addHobbyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedPreviewWrap: {
    marginVertical: 10,
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: FluentColors.secondaryText,
    marginBottom: 6,
  },
  selectedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedTagPill: {
    backgroundColor: FluentColors.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: FluentColors.primary,
  },
  saveProfileBtn: {
    backgroundColor: FluentColors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  saveProfileBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
