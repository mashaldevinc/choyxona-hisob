import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform, Text } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

function TabBadge({ count }: { count: number }) {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <View style={{
      position: 'absolute',
      top: -4,
      right: -10,
      backgroundColor: colors.destructive,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    }}>
      <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { sessions, orders } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';

  // Badge count: unchecked tables + undelivered items
  const activeSessions = sessions.filter((s) => s.status === 'active');
  let badgeCount = 0;
  for (const session of activeSessions) {
    const sessionOrders = orders[session.id] ?? [];
    const hasUndelivered = sessionOrders.some((o) => !o.isDelivered);
    if (hasUndelivered) badgeCount += 1;
  }
  // Also count sessions with no receipt (uncleared tables)
  badgeCount += activeSessions.length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.tabBar,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'web' ? 84 : 64,
          paddingBottom: Platform.OS === 'web' ? 34 : 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Choyxona',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Mehmonlar',
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Faol Ishlar',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Feather name="bell" size={size} color={color} />
              <TabBadge count={badgeCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Qarz Daftar',
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Cheklar',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
