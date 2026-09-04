/**
 * FluentUp - Minimalist 2-Tab Navigation Layout
 * 
 * Design Philosophy:
 * Traditional social media ke 5 confusing tabs nahi hain.
 * Sirf 2 focused tabs:
 * 1. Home (Practice Partner Finder)
 * 2. Profile (Speaking Stats & Settings)
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { FluentColors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: FluentColors.primaryContainer,
        tabBarInactiveTintColor: FluentColors.secondaryText,
        tabBarStyle: {
          backgroundColor: FluentColors.surfaceLowest,
          borderTopColor: FluentColors.outline,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. Home Screen Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 2. Profile Screen Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />

      {/* Hide old explore route from tab bar */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
