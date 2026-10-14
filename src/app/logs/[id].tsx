import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBanner } from '../../components/ui';
import { useSettings } from '../../state/SettingsContext';
import { colors, radius } from '../../theme';

export default function LogsScreen() {
  const { client } = useSettings();
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
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <View style={styles.flex}>
      <View style={styles.bar}>
        <Text style={styles.title} numberOfLines={1}>
          {name ?? 'Container'}
        </Text>
        <Button
          label={paused ? 'Fortsett' : 'Pause'}
          variant="secondary"
          small
          onPress={() => setPaused((p) => !p)}
        />
        <Button label="Last på nytt" variant="ghost" small onPress={() => void load()} />
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 12 }}>
        {lines.length === 0 ? (
          <Text style={styles.empty}>Ingen logger å vise.</Text>
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
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  logBox: {
    flex: 1,
    margin: 12,
    marginTop: 0,
    backgroundColor: '#05070b',
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
  empty: { color: colors.textDim, fontSize: 13 },
});
