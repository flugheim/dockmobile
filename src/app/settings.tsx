import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import type { LangChoice } from '../i18n/translations';
import { CHANGELOG } from '../changelog';
import { colors, radius } from '../theme';

export default function SettingsScreen() {
  const { settings, environments, selectEnvironment, disconnect, client, t, langChoice, setLangChoice, refreshEnvironments } =
    useSettings();
  const [testing, setTesting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshEnvironments();
    }, [refreshEnvironments]),
  );

  async function testConnection() {
    if (!client) return;
    setTesting(true);
    try {
      const envs = await client.getEnvironments();
      Alert.alert(
        t('settings_testOk'),
        envs.length === 1
          ? t('settings_connectedOne', { url: settings?.baseUrl ?? '', env: envs[0].name })
          : t('settings_connectedMany', {
              url: settings?.baseUrl ?? '',
              n: envs.length,
            }),
      );
    } catch (e) {
      Alert.alert(t('settings_testFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  }

  function confirmDisconnect() {
    Alert.alert(t('settings_confirmRemoveTitle'), t('settings_confirmRemoveMessage'), [
      { text: t('common_cancel'), style: 'cancel' },
      { text: t('settings_removeConfirm'), style: 'destructive', onPress: () => void disconnect() },
    ]);
  }

  const langLabel = (choice: LangChoice): string => {
    switch (choice) {
      case 'nb':
        return 'Norsk';
      case 'en':
        return 'English';
      default:
        return t('settings_langSystem');
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t('nav_settings') }} />
      <Text style={styles.groupTitle}>{t('settings_connection')}</Text>
      <View style={styles.card}>
        <Row label={t('settings_server')} value={settings?.baseUrl ?? '–'} />
        <Row label={t('settings_environment')} value={settings?.envName ?? '–'} />
        <Row label={t('settings_token')} value={'dh_…' + (settings?.token?.slice(-4) ?? '')} />
        <Button
          label={t('settings_test')}
          variant="secondary"
          loading={testing}
          onPress={() => void testConnection()}
          style={{ marginTop: 10 }}
        />
      </View>

      <Text style={styles.groupTitle}>{t('settings_language')}</Text>
      <View style={styles.card}>
        <Text style={styles.note}>{t('settings_langNote')}</Text>
        {(['system', 'nb', 'en'] as LangChoice[]).map((choice) => (
          <Button
            key={choice}
            label={langChoice === choice ? `✓ ${langLabel(choice)}` : langLabel(choice)}
            variant={langChoice === choice ? 'primary' : 'secondary'}
            onPress={() => void setLangChoice(choice)}
            style={{ marginTop: 8 }}
            testID={`lang-${choice}`}
          />
        ))}
      </View>

      {environments.length > 1 ? (
        <>
          <Text style={styles.groupTitle}>{t('settings_switchEnv')}</Text>
          <View style={styles.card}>
            {environments.map((env) => (
              <Button
                key={env.id}
                label={env.id === settings?.envId ? `✓ ${env.name}` : env.name}
                variant={env.id === settings?.envId ? 'primary' : 'secondary'}
                onPress={() => void selectEnvironment(env)}
                style={{ marginTop: 8 }}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.groupTitle}>{t('settings_about')}</Text>
      <View style={styles.card}>
        <Row label={t('settings_version')} value={Constants.expoConfig?.version ?? '1.5.2'} />
        <Button
          label={t('settings_changelog')}
          variant="secondary"
          onPress={() =>
            Alert.alert(t('settings_changelogTitle'), CHANGELOG, [{ text: t('common_ok') }])
          }
          style={{ marginTop: 10 }}
        />
        <Text style={styles.about}>{t('settings_about1')}</Text>
        <Text style={styles.about}>{t('settings_about2')}</Text>
      </View>

      <Button
        label={t('settings_remove')}
        variant="danger"
        onPress={confirmDisconnect}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  groupTitle: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  row: { gap: 2 },
  rowLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 14 },
  about: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  note: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
});
