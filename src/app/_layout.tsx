import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, useSettings } from '../state/SettingsContext';
import { font } from '../theme';
import { useTheme } from '../theme/styles';

export default function RootLayout() {
  // JetBrainsMono Nerd Font brukes til både tekst og ikoner.
  const [fontsLoaded, fontError] = useFonts({
    [font.regular]: require('../../assets/fonts/JetBrainsMonoNerdFont-Regular.ttf'),
    [font.bold]: require('../../assets/fonts/JetBrainsMonoNerdFont-Bold.ttf'),
  });

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        {!fontsLoaded && !fontError ? <StartupSplash /> : <RootNavigator />}
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

/** Bakgrunn mens fontene lastes, så vi slipper et hvitt blink. */
function StartupSplash() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { t } = useSettings();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: font.bold, fontSize: 15 },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: t('nav_environments') }} />
        <Stack.Screen name="containers" options={{ title: t('nav_containers') }} />
        <Stack.Screen name="connect" options={{ headerShown: false }} />
        <Stack.Screen name="container/[id]" options={{ title: t('nav_container') }} />
        <Stack.Screen name="logs/[id]" options={{ title: t('nav_logs') }} />
        <Stack.Screen name="stacks" options={{ title: t('nav_stacks') }} />
        <Stack.Screen name="create-stack" options={{ title: t('nav_createStack') }} />
        <Stack.Screen name="settings" options={{ title: t('nav_settings') }} />
      </Stack>
    </>
  );
}
