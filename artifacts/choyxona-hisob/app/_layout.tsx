import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="order/[id]"
        options={{ headerShown: true, title: 'Buyurtma', headerBackTitle: 'Orqaga' }}
      />
      <Stack.Screen
        name="checkout/[id]"
        options={{ headerShown: true, title: 'Hisoblash', headerBackTitle: 'Orqaga' }}
      />
      <Stack.Screen
        name="debt/[id]"
        options={{ headerShown: true, title: 'Qarz tafsiloti', headerBackTitle: 'Orqaga' }}
      />
      <Stack.Screen
        name="templates"
        options={{ headerShown: true, title: 'Shablonlar', headerBackTitle: 'Orqaga' }}
      />
      <Stack.Screen
        name="expenses"
        options={{ headerShown: true, title: 'Chiqimlar', headerBackTitle: 'Orqaga' }}
      />
      <Stack.Screen
        name="notes"
        options={{ headerShown: true, title: 'Qaydlar', headerBackTitle: 'Orqaga' }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: true, title: 'Sozlamalar', headerBackTitle: 'Orqaga' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
