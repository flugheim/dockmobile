import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '../state/SettingsContext';
import { colors, font } from '../theme';

export default function RootLayout() {
  // JetBrainsMono Nerd Font brukes til både tekst og ikoner.
  const [fontsLoaded, fontError] = useFonts({
    [font.regular]: require('../../assets/fonts/JetBrainsMonoNerdFont-Regular.ttf'),
    [font.bold]: require('../../assets/fonts/JetBrainsMonoNerdFont-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    // Tegn bakgrunnen mens fontene lastes, så vi slipper et hvitt blink.
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: font.bold, fontSize: 17 },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Miljøer' }} />
          <Stack.Screen name="containers" options={{ title: 'Containere' }} />
          <Stack.Screen name="connect" options={{ headerShown: false }} />
          <Stack.Screen name="container/[id]" options={{ title: 'Container' }} />
          <Stack.Screen name="logs/[id]" options={{ title: 'Logger' }} />
          <Stack.Screen name="stacks" options={{ title: 'Stacks' }} />
          <Stack.Screen name="create-stack" options={{ title: 'New stack' }} />
          <Stack.Screen name="settings" options={{ title: 'Innstillinger' }} />
        </Stack>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
