import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '../state/SettingsContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Miljøer' }} />
          <Stack.Screen name="containers" options={{ title: 'Containere' }} />
          <Stack.Screen name="connect" options={{ headerShown: false }} />
          <Stack.Screen name="container/[id]" options={{ title: 'Container' }} />
          <Stack.Screen name="logs/[id]" options={{ title: 'Logger' }} />
          <Stack.Screen name="stacks" options={{ title: 'Stacks' }} />
          <Stack.Screen name="settings" options={{ title: 'Innstillinger' }} />
        </Stack>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}