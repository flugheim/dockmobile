import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Button, ErrorBanner } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import { colors, radius } from '../theme';

export default function CreateStackScreen() {
  const { client, status, t } = useSettings();
  const router = useRouter();
  const [name, setName] = useState('');
  const [compose, setCompose] = useState('');
  const [start, setStart] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<{ key: string; value: string; isSecret: boolean }[]>([]);

  function addEnvVar() {
    setEnvVars((prev) => [...prev, { key: '', value: '', isSecret: false }]);
  }

  function updateEnvVar(index: number, field: 'key' | 'value' | 'isSecret', val: string | boolean) {
    setEnvVars((prev) => prev.map((ev, i) => (i === index ? { ...ev, [field]: val } : ev)));
  }

  function removeEnvVar(index: number) {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  }

  if (status === 'disconnected') {
    return <Redirect href="/connect" />;
  }

  async function onCreate() {
    if (!client) return;
    if (!name.trim()) {
      setError(t('stack_nameHint'));
      return;
    }
    if (!compose.trim()) {
      setError(t('stack_composeHint'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const vars = envVars
        .filter((ev) => ev.key.trim().length > 0)
        .map((ev) => ({ key: ev.key.trim(), value: ev.value, isSecret: ev.isSecret }));
      await client.createStack(name.trim(), compose, start, vars);
      Alert.alert(t('stack_created'), name.trim(), [
        { text: t('common_ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t('stack_createTitle') }} />

      <Text style={styles.label}>{t('stack_name')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="my-stack"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        testID="stack-name"
      />
      <Text style={styles.hint}>{t('stack_nameHint')}</Text>

      <Text style={styles.label}>{t('stack_compose')}</Text>
      <TextInput
        style={[styles.input, styles.composeInput]}
        value={compose}
        onChangeText={setCompose}
        placeholder={'services:\n  web:\n    image: nginx:latest\n    ports:\n      - "8080:80"'}
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        textAlignVertical="top"
        testID="stack-compose"
      />
      <Text style={styles.hint}>{t('stack_composeHint')}</Text>

      <Text style={styles.label}>{t('stack_envVars')}</Text>
      {envVars.map((ev, idx) => (
        <View key={idx} style={styles.envRow}>
          <TextInput
            style={[styles.input, styles.envInput]}
            value={ev.key}
            onChangeText={(v) => updateEnvVar(idx, 'key', v)}
            placeholder={t('stack_envKey')}
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, styles.envInput]}
            value={ev.value}
            onChangeText={(v) => updateEnvVar(idx, 'value', v)}
            placeholder={t('stack_envValue')}
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={ev.isSecret}
          />
          <TouchableOpacity onPress={() => updateEnvVar(idx, 'isSecret', !ev.isSecret)} style={styles.secretToggle}>
            <Text style={styles.secretText}>{ev.isSecret ? '🔒' : '🔓'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeEnvVar(idx)} style={styles.removeBtn}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Button
        label={t('stack_addEnvVar')}
        variant="secondary"
        small
        onPress={addEnvVar}
        style={{ marginTop: 6 }}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{t('stack_startNow')}</Text>
        <Switch
          value={start}
          onValueChange={setStart}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#fff"
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      <Button
        label={busy ? t('connect_connecting') : t('stack_createButton')}
        loading={busy}
        onPress={() => void onCreate()}
        style={{ marginTop: 16 }}
        testID="stack-create-button"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 4,
  },
  composeInput: {
    minHeight: 200,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 6 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
  },
  envRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  envInput: {
    flex: 1,
    marginTop: 0,
    paddingVertical: 8,
    fontSize: 13,
  },
  secretToggle: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  secretText: { fontSize: 16 },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  removeText: { color: colors.red, fontSize: 16, fontWeight: '700' },
  toggleLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
