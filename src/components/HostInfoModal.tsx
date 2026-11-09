import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from './ui';
import { useSettings } from '../state/SettingsContext';
import { DockhandClient } from '../api/client';
import type { DockhandEnvironment, HostInfo, SystemInfo } from '../types';
import { colors, radius } from '../theme';

interface Props {
  visible: boolean;
  environment: DockhandEnvironment | null;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length ? parts.join(' ') : `${seconds}s`;
}

export function HostInfoModal({ visible, environment, onClose }: Props) {
  const { settings, t } = useSettings();
  const [host, setHost] = useState<HostInfo | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !environment || !settings) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setHost(null);
      setSystem(null);
      try {
        const client = new DockhandClient({
          baseUrl: settings.baseUrl,
          token: settings.token,
          envId: environment.id,
          timeoutMs: 15000,
        });
        const [h, s] = await Promise.all([
          client.getHostInfo().catch(() => null),
          client.getSystemInfo().catch(() => null),
        ]);
        if (cancelled) return;
        setHost(h);
        setSystem(s);
        if (!h && !s) setError(t('hostInfo_error'));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, environment, settings, t]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('hostInfo_title')}</Text>
            {environment ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {environment.name}
              </Text>
            ) : null}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {loading ? (
              <Text style={styles.muted}>{t('hostInfo_loading')}</Text>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <>
                {host ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('hostInfo_serverSection')}</Text>
                    {host.hostname ? <InfoRow label={t('hostInfo_hostname')} value={host.hostname} /> : null}
                    {host.ipAddress ? <InfoRow label={t('hostInfo_ipAddress')} value={host.ipAddress} /> : null}
                    {host.platform ? <InfoRow label={t('hostInfo_platform')} value={host.platform} /> : null}
                    {host.arch ? <InfoRow label={t('hostInfo_arch')} value={host.arch} /> : null}
                    {host.cpus ? <InfoRow label={t('hostInfo_cpus')} value={String(host.cpus)} /> : null}
                    {host.totalMemory ? <InfoRow label={t('hostInfo_totalMemory')} value={formatBytes(host.totalMemory)} /> : null}
                    {host.freeMemory ? <InfoRow label={t('hostInfo_freeMemory')} value={formatBytes(host.freeMemory)} /> : null}
                    {host.uptime ? <InfoRow label={t('hostInfo_uptime')} value={formatUptime(host.uptime)} /> : null}
                    {host.dockerVersion ? <InfoRow label={t('hostInfo_dockerVersion')} value={host.dockerVersion} /> : null}
                    {host.dockerContainers > 0 ? (
                      <InfoRow label={t('hostInfo_containers')} value={`${host.dockerContainersRunning}/${host.dockerContainers}`} />
                    ) : null}
                    {host.dockerImages ? <InfoRow label={t('hostInfo_images')} value={String(host.dockerImages)} /> : null}
                    {host.environment?.connectionType ? (
                      <InfoRow label={t('hostInfo_connectionType')} value={host.environment.connectionType} />
                    ) : null}
                  </View>
                ) : null}

                {system ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('hostInfo_systemSection')}</Text>
                    {system.runtime?.runtimeName ? (
                      <InfoRow label={t('hostInfo_runtime')} value={`${system.runtime.runtimeName}${system.runtime.platform ? ` (${system.runtime.platform})` : ''}`} />
                    ) : null}
                    {system.docker?.version ? (
                      <InfoRow label={t('hostInfo_dockerApi')} value={`${system.docker.version}${system.docker.apiVersion ? ` (API ${system.docker.apiVersion})` : ''}`} />
                    ) : null}
                    {system.database?.type ? (
                      <InfoRow label={t('hostInfo_database')} value={`${system.database.type}${system.database.schemaVersion ? ` (schema ${system.database.schemaVersion})` : ''}`} />
                    ) : null}
                    {system.stats ? (
                      <>
                        {system.stats.containers ? (
                          <InfoRow
                            label={t('hostInfo_statsContainers')}
                            value={`${system.stats.containers.running ?? 0}/${system.stats.containers.total ?? 0}`}
                          />
                        ) : null}
                        {typeof system.stats.images === 'number' ? <InfoRow label={t('hostInfo_statsImages')} value={String(system.stats.images)} /> : null}
                        {typeof system.stats.volumes === 'number' ? <InfoRow label={t('hostInfo_statsVolumes')} value={String(system.stats.volumes)} /> : null}
                        {typeof system.stats.networks === 'number' ? <InfoRow label={t('hostInfo_statsNetworks')} value={String(system.stats.networks)} /> : null}
                        {typeof system.stats.stacks === 'number' ? <InfoRow label={t('hostInfo_statsStacks')} value={String(system.stats.stacks)} /> : null}
                      </>
                    ) : null}
                  </View>
                ) : null}

                {!host && !system && !error ? (
                  <Text style={styles.muted}>{t('hostInfo_noData')}</Text>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Button label={t('common_close')} variant="secondary" small onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  header: { gap: 2 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  scroll: { maxHeight: 420 },
  scrollContent: { gap: 12 },
  section: { gap: 6 },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  row: { gap: 2, paddingVertical: 2 },
  rowLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 14 },
  muted: { color: colors.textDim, fontSize: 13 },
  error: { color: colors.red, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}