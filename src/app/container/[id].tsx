import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, ErrorBanner } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useSettings } from '../../state/SettingsContext';

import type { Container, ContainerInspect } from '../../types';
import { alpha, colors, radius, stateColor } from '../../theme';
import { containerStateLabel } from '../../i18n/translations';

export default function ContainerDetailScreen() {
  const { client, t, lang } = useSettings();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [container, setContainer] = useState<Container | null>(null);
  const [inspect, setInspect] = useState<ContainerInspect | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    try {
      const [list, pending, insp] = await Promise.all([
        client.getContainers(),
        client.getPendingUpdates().catch(() => []),
        client.getContainerInspect(id),
      ]);
      const found = list.find((c) => c.id === id);
      if (!found) {
        setContainer(null);
        setError(t('detail_notFound'));
        return;
      }
      const pendingIds = new Set(pending.map((c) => c.id));
      setContainer({ ...found, updateAvailable: found.updateAvailable || pendingIds.has(found.id) });
      setInspect(insp && Object.keys(insp).length > 0 ? insp : null);
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
  const status = stateColor(container.state);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t('nav_container') }} />
      <View style={styles.header}>
        <Icon name="cube" size={22} color={status} />
        <Text style={styles.name}>{container.name}</Text>
        <View style={[styles.pill, { borderColor: status }]}>
          <Text style={[styles.pillText, { color: status }]}>
            {containerStateLabel(container.state, lang)}
          </Text>
        </View>
      </View>

      {container.updateAvailable ? (
        <View style={styles.updateBox}>
          <Icon name="download" size={16} color={colors.amber} />
          <Text style={styles.updateText}>{t('detail_updateAvailable')}</Text>
          <Button
            label={t('detail_updateNow')}
            icon="download"
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
            icon="stop"
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
            icon="play"
            disabled={busy}
            onPress={() => void runAction(() => client!.startContainer(container.id))}
          />
        )}
        <Button
          label={t('card_restart')}
          icon="restart"
          variant="secondary"
          disabled={busy || !running}
          onPress={() => void runAction(() => client!.restartContainer(container.id))}
        />
      </View>

      <View style={styles.infoCard}>
        <Row icon="file" label={t('detail_image')} value={container.image} />
        <Row icon="tag" label={t('detail_id')} value={container.id} />
        {container.statusText ? <Row icon="information" label={t('detail_status')} value={container.statusText} /> : null}
        {inspect?.Created ? <Row icon="clock" label={t('detail_created')} value={formatDate(inspect.Created)} /> : null}
        {inspect?.State?.StartedAt && inspect.State.StartedAt !== '0001-01-01T00:00:00Z' ? (
          <Row icon="play" label={t('detail_started')} value={formatDate(inspect.State.StartedAt)} />
        ) : null}
        {inspect?.State?.FinishedAt && inspect.State.FinishedAt !== '0001-01-01T00:00:00Z' ? (
          <Row icon="stop" label={t('detail_finished')} value={formatDate(inspect.State.FinishedAt)} />
        ) : null}
        {typeof inspect?.State?.ExitCode === 'number' && inspect.State.ExitCode !== 0 ? (
          <Row icon="close" label={t('detail_exitCode')} value={String(inspect.State.ExitCode)} />
        ) : null}
        {typeof inspect?.RestartCount === 'number' && inspect.RestartCount > 0 ? (
          <Row icon="restart" label={t('detail_restarts')} value={String(inspect.RestartCount)} />
        ) : null}
        {inspect?.HostConfig?.RestartPolicy?.Name ? (
          <Row
            icon="refresh"
            label={t('detail_restartPolicy')}
            value={
              inspect.HostConfig.RestartPolicy.Name +
              (inspect.HostConfig.RestartPolicy.MaximumRetryCount
                ? ` (${inspect.HostConfig.RestartPolicy.MaximumRetryCount})`
                : '')
            }
          />
        ) : null}
        {inspect?.HostConfig?.Memory ? (
          <Row icon="memory" label={t('detail_memory')} value={formatBytes(inspect.HostConfig.Memory)} />
        ) : null}
        {inspect?.HostConfig?.NanoCpus ? (
          <Row icon="cpu" label={t('detail_cpu')} value={`${(inspect.HostConfig.NanoCpus / 1e9).toFixed(2)} cores`} />
        ) : null}
        {inspect?.State?.Health?.Status ? (
          <Row icon="shield-check" label={t('detail_health')} value={inspect.State.Health.Status} />
        ) : null}
      </View>

      {inspect ? (
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Icon name="network" size={14} color={colors.accent} />
            <Text style={styles.sectionLabel}>{t('detail_ports')}</Text>
          </View>
          {formatPorts(inspect).length === 0 ? (
            <Text style={styles.mutedSmall}>{t('detail_noPorts')}</Text>
          ) : (
            formatPorts(inspect).map((p, i) => (
              <Text key={i} style={styles.detailLine} selectable>
                {p}
              </Text>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Icon name="layers" size={14} color={colors.accent} />
            <Text style={styles.sectionLabel}>{t('detail_mounts')}</Text>
          </View>
          {formatMounts(inspect).length === 0 ? (
            <Text style={styles.mutedSmall}>{t('detail_noMounts')}</Text>
          ) : (
            formatMounts(inspect).map((m, i) => (
              <Text key={i} style={styles.detailLine} selectable>
                {m}
              </Text>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Icon name="lan" size={14} color={colors.accent} />
            <Text style={styles.sectionLabel}>{t('detail_networks')}</Text>
          </View>
          {formatNetworks(inspect).length === 0 ? (
            <Text style={styles.mutedSmall}>{t('detail_noNetworks')}</Text>
          ) : (
            formatNetworks(inspect).map((n, i) => (
              <Text key={i} style={styles.detailLine} selectable>
                {n}
              </Text>
            ))
          )}
        </View>
      ) : null}

      <Button
        label={t('detail_viewLogs')}
        icon="terminal"
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

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={14} color={colors.textDim} style={styles.rowIcon} />
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
  name: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  updateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: alpha(colors.amber, 0.5),
    backgroundColor: alpha(colors.amber, 0.1),
    borderRadius: radius.md,
    padding: 12,
  },
  updateText: { color: colors.amber, flex: 1, fontWeight: '600', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowIcon: { marginTop: 1, marginRight: 4 },
  rowLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', minWidth: 100 },
  rowValue: { color: colors.text, fontSize: 14, flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sectionLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  detailLine: { color: colors.text, fontSize: 12, fontFamily: 'monospace', lineHeight: 17, marginLeft: 24 },
  mutedSmall: { color: colors.textDim, fontSize: 12, marginLeft: 24 },
});

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

function formatPorts(insp: ContainerInspect): string[] {
  const ports = insp.NetworkSettings?.Ports;
  if (!ports) return [];
  const out: string[] = [];
  for (const [containerPort, bindings] of Object.entries(ports)) {
    if (!bindings || bindings.length === 0) {
      out.push(`${containerPort} (exposed)`);
    } else {
      for (const b of bindings) {
        out.push(`${b.HostIp || '0.0.0.0'}:${b.HostPort} -> ${containerPort}`);
      }
    }
  }
  return out;
}

function formatMounts(insp: ContainerInspect): string[] {
  const mounts = insp.Mounts;
  if (!Array.isArray(mounts)) return [];
  return mounts.map((m) => {
    const src = m.Source || '(anonymous)';
    const dst = m.Destination || '';
    const mode = m.Mode ? ` [${m.Mode}]` : '';
    return `${src} -> ${dst}${mode}`;
  });
}

function formatNetworks(insp: ContainerInspect): string[] {
  const nets = insp.NetworkSettings?.Networks;
  if (!nets) return [];
  return Object.entries(nets).map(([name, info]) => (info?.IPAddress ? `${name}: ${info.IPAddress}` : name));
}