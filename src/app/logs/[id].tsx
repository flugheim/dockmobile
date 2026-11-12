import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ErrorBanner, IconButton } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useSettings } from '../../state/SettingsContext';
import { colors, radius } from '../../theme';

export default function LogsScreen() {
  const { client, t } = useSettings();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [lines, setLines] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client || paused) return;
    try {
      const logs = await client.getLogs(id, 400);
      setLines(logs.map((l) => l.text));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [client, id, paused]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: t('nav_logs') }} />
      <View style={styles.bar}>
        <View style={styles.titleWrap}>
          <Icon name="terminal" size={18} color={colors.accent} />
          <Text style={styles.title} numberOfLines={1}>
            {name ?? t('logs_fallbackName')}
          </Text>
        </View>
        <View style={styles.barActions}>
          <IconButton
            icon={paused ? 'play' : 'pause'}
            size={16}
            accessibilityLabel={paused ? t('logs_resume') : t('logs_pause')}
            onPress={() => setPaused((p) => !p)}
            variant="ghost"
            testID="logs-pause"
          />
          <IconButton
            icon="refresh"
            size={16}
            accessibilityLabel={t('logs_reload')}
            onPress={() => void load()}
            variant="ghost"
            testID="logs-reload"
          />
        </View>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 12 }}>
        {lines.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="file" size={30} color={colors.textMuted} />
            <Text style={styles.empty}>{t('logs_empty')}</Text>
          </View>
        ) : (
          lines.map((l, i) => (
            <Text key={i} style={styles.line}>
              {l}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  barActions: { flexDirection: 'row', gap: 4 },
  logBox: {
    flex: 1,
    margin: 12,
    marginTop: 0,
    backgroundColor: colors.bgDeep,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  line: {
    color: '#c9d4e3',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  empty: { color: colors.textDim, fontSize: 13 },
});