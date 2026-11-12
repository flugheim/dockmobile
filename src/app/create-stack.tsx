import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Button, ErrorBanner } from '../components/ui';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
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

      <View style={styles.field}>
        <Text style={styles.label}>{t('stack_name')}</Text>
        <View style={styles.inputWrap}>
          <Icon name="tag" size={17} color={colors.textDim} style={styles.inputIcon} />
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
        </View>
        <Text style={styles.hint}>{t('stack_nameHint')}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('stack_compose')}</Text>
        <View style={styles.inputWrap}>
          <Icon name="file" size={17} color={colors.textDim} style={styles.inputIcon} />
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
        </View>
        <Text style={styles.hint}>{t('stack_composeHint')}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('stack_envVars')}</Text>
        {envVars.map((ev, idx) => (
          <View key={idx} style={styles.envRow}>
            <View style={styles.envInputWrap}>
              <Icon name="key" size={15} color={colors.textDim} style={styles.envInputIcon} />
              <TextInput
                style={[styles.input, styles.envInput]}
                value={ev.key}
                onChangeText={(v) => updateEnvVar(idx, 'key', v)}
                placeholder={t('stack_envKey')}
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.envInputWrap}>
              <Icon name={ev.isSecret ? 'lock' : 'lockOpen'} size={15} color={colors.textDim} style={styles.envInputIcon} />
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
            </View>
            <TouchableOpacity onPress={() => updateEnvVar(idx, 'isSecret', !ev.isSecret)} style={styles.secretToggle}>
              <Icon name={ev.isSecret ? 'lockOpen' : 'lock'} size={16} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeEnvVar(idx)} style={styles.removeBtn}>
              <Icon name="trash" size={16} color={colors.red} />
            </TouchableOpacity>
          </View>
        ))}
        <Button
          label={t('stack_addEnvVar')}
          icon="plus"
          variant="secondary"
          small
          onPress={addEnvVar}
          style={{ marginTop: 6 }}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelWrap}>
          <Icon name="play" size={18} color={colors.accent} />
          <Text style={styles.toggleLabel}>{t('stack_startNow')}</Text>
        </View>
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
        icon="plus"
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
  field: { marginTop: 16 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
    fontSize: 15,
  },
  composeInput: {
    minHeight: 200,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 6 },
  envRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  envInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  envInputIcon: { marginRight: 8 },
  envInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 8,
    fontSize: 13,
  },
  secretToggle: { paddingHorizontal: 6, paddingVertical: 8 },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
});