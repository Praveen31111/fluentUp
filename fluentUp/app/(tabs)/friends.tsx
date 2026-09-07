/**
 * FluentUp - Friends Hub Screen
 * 
 * 1. My Friends: List of accepted speaking partners with direct Voice / Video calling.
 * 2. Requests: Pending incoming friend requests with 1-tap Accept / Decline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { FriendsApi, FriendItem, PendingRequestItem } from '@/services/friends.api';

export default function FriendsScreen() {
  const { authToken, user, startDirectCall } = useApp();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load friends and pending requests from backend
  const loadData = useCallback(async () => {
    if (!authToken) return;
    try {
      const [friends, requests] = await Promise.all([
        FriendsApi.getFriendsList(authToken),
        FriendsApi.getPendingRequests(authToken),
      ]);
      setFriendsList(friends);
      setPendingRequests(requests);
    } catch (e) {
      console.warn('Error loading friends data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Accept incoming request
  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    if (!authToken) return;
    setProcessingId(requestId);
    const result = await FriendsApi.acceptRequest(authToken, requestId);
    setProcessingId(null);
    if (result.success) {
      Alert.alert('Success', `You are now friends with ${senderName}!`);
      loadData();
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  // Decline incoming request
  const handleDeclineRequest = async (requestId: string) => {
    if (!authToken) return;
    setProcessingId(requestId);
    const result = await FriendsApi.rejectRequest(authToken, requestId);
    setProcessingId(null);
    if (result.success) {
      loadData();
    }
  };

  // Remove a friend
  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!authToken) return;
            const res = await FriendsApi.removeFriend(authToken, friendshipId);
            if (res.success) {
              loadData();
            }
          },
        },
      ],
    );
  };

  // Initiate direct call to a friend
  const handleCallFriend = (friend: any, mode: 'audio' | 'video') => {
    startDirectCall(friend, mode);
  };

  // Render Friend Card
  const renderFriendCard = ({ item }: { item: FriendItem }) => {
    const friend = item.friend;
    return (
      <View style={styles.friendCard}>
        {/* Left: Avatar & Info */}
        <View style={styles.friendCardLeft}>
          {friend.photoUrl ? (
            <Image source={{ uri: friend.photoUrl }} style={styles.friendAvatar} />
          ) : (
            <View style={styles.friendAvatarPlaceholder}>
              <Text style={styles.friendInitials}>
                {friend.username ? friend.username[0].toUpperCase() : 'F'}
              </Text>
            </View>
          )}

          <View style={styles.friendInfo}>
            <Text style={styles.friendName} numberOfLines={1}>
              {friend.username}
            </Text>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{friend.level || 'B1'}</Text>
              </View>
              {friend.topTopic && (
                <Text style={styles.topicText} numberOfLines={1}>
                  · {friend.topTopic}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Right: Direct Call Actions */}
        <View style={styles.friendActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionCallBtn, styles.voiceBtn]}
            onPress={() => handleCallFriend(friend, 'audio')}
          >
            <MaterialIcons name="call" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionCallBtn, styles.videoBtn]}
            onPress={() => handleCallFriend(friend, 'video')}
          >
            <MaterialIcons name="videocam" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.moreBtn}
            onPress={() => handleRemoveFriend(item.friendshipId, friend.username)}
          >
            <MaterialIcons name="more-vert" size={20} color={FluentColors.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Pending Request Card
  const renderRequestCard = ({ item }: { item: PendingRequestItem }) => {
    const isBusy = processingId === item.requestId;
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestLeft}>
          {item.sender.photoUrl ? (
            <Image source={{ uri: item.sender.photoUrl }} style={styles.requestAvatar} />
          ) : (
            <View style={styles.requestAvatarPlaceholder}>
              <Text style={styles.friendInitials}>
                {item.sender.username ? item.sender.username[0].toUpperCase() : 'L'}
              </Text>
            </View>
          )}

          <View style={styles.requestInfo}>
            <Text style={styles.friendName}>{item.sender.username}</Text>
            <Text style={styles.requestSub}>
              {item.sender.level || 'B1 Fluency'} · Wants to connect
            </Text>
          </View>
        </View>

        <View style={styles.requestButtonRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isBusy}
            style={styles.acceptRequestBtn}
            onPress={() => handleAcceptRequest(item.requestId, item.sender.username)}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptRequestText}>Accept</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isBusy}
            style={styles.declineRequestBtn}
            onPress={() => handleDeclineRequest(item.requestId)}
          >
            <Text style={styles.declineRequestText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Speaking Friends</Text>
          <Text style={styles.headerSubtitle}>Direct 1-on-1 voice & video practice</Text>
        </View>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.tabItem, activeTab === 'friends' && styles.tabItemActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}
          >
            My Friends ({friendsList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.requestTabRow}>
            <Text
              style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}
            >
              Requests
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={FluentColors.primaryContainer} />
        </View>
      ) : activeTab === 'friends' ? (
        friendsList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="people-outline" size={44} color={FluentColors.primaryContainer} />
            </View>
            <Text style={styles.emptyTitle}>No Speaking Friends Yet</Text>
            <Text style={styles.emptySub}>
              After finishing a call with a speaking partner, tap "Add as Friend" on the feedback
              screen to practice together again anytime!
            </Text>
          </View>
        ) : (
          <FlatList
            data={friendsList}
            keyExtractor={(item) => item.friendshipId}
            renderItem={renderFriendCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        )
      ) : pendingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="mark-email-read" size={44} color={FluentColors.primaryContainer} />
          </View>
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptySub}>
            When a practice partner sends you a friend request, it will appear right here for you to accept.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.requestId}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FluentColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: FluentColors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: FluentColors.secondaryText,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#EAEAE7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: FluentColors.secondaryText,
  },
  tabTextActive: {
    color: FluentColors.text,
    fontWeight: '700',
  },
  requestTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  requestBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  friendCard: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: FluentColors.outline,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  friendCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  friendAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: FluentColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: FluentColors.text,
    marginBottom: 4,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: FluentColors.primaryContainer,
  },
  topicText: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    flex: 1,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceBtn: {
    backgroundColor: FluentColors.primaryContainer,
    shadowColor: FluentColors.primaryContainer,
  },
  videoBtn: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
  },
  moreBtn: {
    padding: 4,
  },
  requestCard: {
    backgroundColor: FluentColors.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: FluentColors.outline,
    marginBottom: 10,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  requestAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FluentColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestSub: {
    fontSize: 12,
    color: FluentColors.secondaryText,
    marginTop: 2,
  },
  requestButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  acceptRequestBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptRequestText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  declineRequestBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineRequestText: {
    color: FluentColors.secondaryText,
    fontWeight: '600',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FluentColors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20,
    color: FluentColors.secondaryText,
    textAlign: 'center',
  },
});
