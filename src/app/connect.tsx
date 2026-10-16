import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, ErrorBanner } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import { colors, radius } from '../theme';

export default function ConnectScreen() {
  const { connect, error, t } = useSettings();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit() {
    setLocalError(null);
    setBusy(true);
    try {
      await connect(url, token);
      router.replace('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/missing token|no environments/i.test(msg)) {
        setLocalError(
          msg.includes('Network') || msg.includes('nå')
            ? msg
            : `${t('connect_failedPrefix')}${msg}`,
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>⚓</Text>
        <Text style={styles.title}>Dockhand</Text>
        <Text style={styles.subtitle}>{t('connect_subtitle')}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t('connect_server')}</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.10:3000"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>{t('connect_token')}</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="dh_..."
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.hint}>{t('connect_tokenHint')}</Text>

          {shownError ? <ErrorBanner message={shownError} /> : null}

          <Button
            label={busy ? t('connect_connecting') : t('connect_button')}
            onPress={onSubmit}
            loading={busy}
            disabled={!url.trim() || !token.trim()}
            style={{ marginTop: 8 }}
            testID="connect-button"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 72, flexGrow: 1 },
  logo: { fontSize: 44, textAlign: 'center' },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  form: { marginTop: 32, gap: 4 },
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
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
