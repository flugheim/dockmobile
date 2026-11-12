import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, ErrorBanner } from '../components/ui';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { useSettings } from '../state/SettingsContext';
import { colors, radius } from '../theme';

// Import TextInput here to avoid circular dependency
import { TextInput } from 'react-native';

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
        <View style={styles.logoWrap}>
          <Icon name="docker" size={48} color={colors.accent} />
        </View>
        <Text style={styles.title}>Dockhand</Text>
        <Text style={styles.subtitle}>{t('connect_subtitle')}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t('connect_server')}</Text>
          <View style={styles.inputWrap}>
            <Icon name="server" size={17} color={colors.textDim} style={styles.inputIcon} />
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
          </View>
          {url.trim().toLowerCase().startsWith('http://') ? (
            <View style={styles.warningRow}>
              <Icon name="warning" size={13} color={colors.amber} />
              <Text style={styles.httpWarning}>{t('connect_httpWarning')}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{t('connect_token')}</Text>
          <View style={styles.inputWrap}>
            <Icon name="key" size={17} color={colors.textDim} style={styles.inputIcon} />
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
          </View>
          <Text style={styles.hint}>{t('connect_tokenHint')}</Text>

          {shownError ? <ErrorBanner message={shownError} /> : null}

          <Button
            label={busy ? t('connect_connecting') : t('connect_button')}
            icon="arrowRight"
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
  logoWrap: { alignItems: 'center', marginBottom: 4 },
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
    fontSize: 15,
  },
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 8 },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  httpWarning: { color: colors.amber, fontSize: 12, lineHeight: 18, flex: 1 },
});