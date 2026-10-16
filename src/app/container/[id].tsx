import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBanner } from '../../components/ui';
import { useSettings } from '../../state/SettingsContext';
import { extractUpdateIds } from '../../api/client';
import type { Container } from '../../types';
import { colors, radius, stateColor } from '../../theme';
import { containerStateLabel } from '../../i18n/translations';

export default function ContainerDetailScreen() {
  const { client, t, lang } = useSettings();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [container, setContainer] = useState<Container | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    try {
      const [list, pending] = await Promise.all([
        client.getContainers(),
        client.getPendingUpdates().catch(() => []),
      ]);
      const found = list.find((c) => c.id === id);
      if (!found) {
        setContainer(null);
        setError(t('detail_notFound'));
        return;
      }
      const updateIds = extractUpdateIds(pending);
      setContainer({ ...found, updateAvailable: found.updateAvailable || updateIds.has(found.id) });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [client, id, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      setTimeout(() => void load(), 1200);
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !container) {
    return (
      <View style={styles.flex}>
        <Stack.Screen options={{ title: t('nav_container') }} />
        <ErrorBanner message={error} onRetry={() => void load()} />
      </View>
    );
  }

  if (!container) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Stack.Screen options={{ title: t('nav_container') }} />
        <Text style={styles.muted}>{t('detail_loading')}</Text>
      </View>
    );
  }

  const running = container.state === 'running';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t('nav_container') }} />
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: stateColor(container.state) }]} />
        <Text style={styles.name}>{container.name}</Text>
        <View style={[styles.pill, { borderColor: stateColor(container.state) }]}>
          <Text style={[styles.pillText, { color: stateColor(container.state) }]}>
            {containerStateLabel(container.state, lang)}
          </Text>
        </View>
      </View>

      {container.updateAvailable ? (
        <View style={styles.updateBox}>
          <Text style={styles.updateText}>{t('detail_updateAvailable')}</Text>
          <Button
            label={t('detail_updateNow')}
            small
            loading={busy}
            onPress={() => void runAction(() => client!.updateContainers([container.id]))}
            testID="detail-update"
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        {running ? (
          <Button
            label={t('card_stop')}
            variant="danger"
            disabled={busy}
            onPress={() =>
              Alert.alert(t('confirmStopTitle', { name: container.name }), '', [
                { text: t('common_cancel'), style: 'cancel' },
                {
                  text: t('common_stop'),
                  style: 'destructive',
                  onPress: () => void runAction(() => client!.stopContainer(container.id)),
                },
              ])
            }
          />
        ) : (
          <Button
            label={t('card_start')}
            disabled={busy}
            onPress={() => void runAction(() => client!.startContainer(container.id))}
          />
        )}
        <Button
          label={t('card_restart')}
          variant="secondary"
          disabled={busy || !running}
          onPress={() => void runAction(() => client!.restartContainer(container.id))}
        />
      </View>

      <View style={styles.infoCard}>
        <Row label={t('detail_image')} value={container.image} />
        <Row label={t('detail_id')} value={container.id} />
        {container.statusText ? <Row label={t('detail_status')} value={container.statusText} /> : null}
      </View>

      <Button
        label={t('detail_viewLogs')}
        variant="secondary"
        style={{ marginTop: 12 }}
        onPress={() =>
          router.push({
            pathname: '/logs/[id]',
            params: { id: container.id, name: container.name },
          })
        }
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
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textDim },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  updateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: 'rgba(210,153,34,0.12)',
    borderRadius: radius.md,
    padding: 12,
  },
  updateText: { color: colors.amber, flex: 1, fontWeight: '600', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  row: { gap: 2 },
  rowLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 14 },
});
