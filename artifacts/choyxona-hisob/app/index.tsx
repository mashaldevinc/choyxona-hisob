import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function IndexScreen() {
  const { isSetupDone, isLoading } = useApp();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSetupDone) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)" />;
}
