import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Button } from './ui';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
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

/**
 * Normaliseringen returnerer alltid et objekt, selv når serveren svarer med
 * tomt innhold. Sjekk derfor om det faktisk finnes noe å vise, slik at modalen
 * aldri ender opp som et tomt vindu.
 */
function hostHasData(h: HostInfo | null): boolean {
  if (!h) return false;
  return Boolean(
    h.hostname ||
      h.ipAddress ||
      h.platform ||
      h.arch ||
      h.cpus ||
      h.totalMemory ||
      h.freeMemory ||
      h.uptime ||
      h.dockerVersion ||
      h.dockerContainers ||
      h.dockerContainersRunning ||
      h.dockerImages ||
      h.environment?.connectionType,
  );
}

function systemHasData(s: SystemInfo | null): boolean {
  if (!s) return false;
  return Boolean(
    (s.runtime && (s.runtime.runtimeName || s.runtime.platform)) ||
      (s.docker && (s.docker.version || s.docker.apiVersion)) ||
      (s.database && (s.database.type || s.database.schemaVersion)) ||
      s.stats,
  );
}

const sectionIcons: Record<string, IconName> = {
  serverSection: 'server',
  systemSection: 'cube',
  hostname: 'tag',
  ipAddress: 'lan',
  platform: 'cube',
  arch: 'chip',
  cpus: 'cpu',
  totalMemory: 'memory',
  freeMemory: 'memory',
  uptime: 'clock',
  dockerVersion: 'docker',
  containers: 'cube',
  images: 'image',
  connectionType: 'lan',
  runtime: 'terminal',
  dockerApi: 'docker',
  database: 'database',
  statsContainers: 'cube',
  statsImages: 'image',
  statsVolumes: 'layers',
  statsNetworks: 'network',
  statsStacks: 'layers',
};

function InfoRow({ label, value, labelKey }: { label: string; value: string; labelKey: string }) {
  const iconName = sectionIcons[labelKey] as IconName | undefined;
  return (
    <View style={styles.infoRow}>
      {iconName && <Icon name={iconName} size={15} color={colors.textDim} style={styles.rowIcon} />}
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export function HostInfoModal({ visible, environment, onClose }: Props) {
  const { settings, t } = useSettings();
  const { height } = useWindowDimensions();
  const maxScrollHeight = Math.round(height * 0.55);
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
        let h: HostInfo | null = null;
        let s: SystemInfo | null = null;
        try {
          h = await client.getHostInfo();
        } catch (e) {
          console.warn('[HostInfoModal] getHostInfo failed:', e);
        }
        try {
          s = await client.getSystemInfo();
        } catch (e) {
          console.warn('[HostInfoModal] getSystemInfo failed:', e);
        }
        if (cancelled) return;
        const hasHost = hostHasData(h);
        const hasSystem = systemHasData(s);
        setHost(hasHost ? h : null);
        setSystem(hasSystem ? s : null);
        if (!hasHost && !hasSystem) {
          setError(t('hostInfo_error'));
        } else if (!hasHost || !hasSystem) {
          // Vis advarsel hvis kun ett av kallene lyktes
          const missing = !hasHost ? 'host' : 'system';
          setError(t('hostInfo_partialError', { missing }));
        }
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
            <Icon name="server" size={22} color={colors.accent} />
            <Text style={styles.title}>{t('hostInfo_title')}</Text>
          </View>
          {environment ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {environment.name}
            </Text>
          ) : null}

          <ScrollView style={[styles.scroll, { maxHeight: maxScrollHeight }]} contentContainerStyle={styles.scrollContent}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <Icon name="refresh" size={20} color={colors.accent} style={styles.loadingIcon} />
                <Text style={styles.muted}>{t('hostInfo_loading')}</Text>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={styles.errorWrap}>
                    <Icon name="warning" size={16} color={colors.red} />
                    <Text style={styles.error}>{error}</Text>
                  </View>
                ) : null}
                {host ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Icon name={sectionIcons.serverSection} size={16} color={colors.accent} />
                      <Text style={styles.sectionTitle}>{t('hostInfo_serverSection')}</Text>
                    </View>
                    {host.hostname ? <InfoRow label={t('hostInfo_hostname')} value={host.hostname} labelKey="hostname" /> : null}
                    {host.ipAddress ? <InfoRow label={t('hostInfo_ipAddress')} value={host.ipAddress} labelKey="ipAddress" /> : null}
                    {host.platform ? <InfoRow label={t('hostInfo_platform')} value={host.platform} labelKey="platform" /> : null}
                    {host.arch ? <InfoRow label={t('hostInfo_arch')} value={host.arch} labelKey="arch" /> : null}
                    {host.cpus ? <InfoRow label={t('hostInfo_cpus')} value={String(host.cpus)} labelKey="cpus" /> : null}
                    {host.totalMemory ? <InfoRow label={t('hostInfo_totalMemory')} value={formatBytes(host.totalMemory)} labelKey="totalMemory" /> : null}
                    {host.freeMemory ? <InfoRow label={t('hostInfo_freeMemory')} value={formatBytes(host.freeMemory)} labelKey="freeMemory" /> : null}
                    {host.uptime ? <InfoRow label={t('hostInfo_uptime')} value={formatUptime(host.uptime)} labelKey="uptime" /> : null}
                    {host.dockerVersion ? <InfoRow label={t('hostInfo_dockerVersion')} value={host.dockerVersion} labelKey="dockerVersion" /> : null}
                    {host.dockerContainers > 0 ? (
                      <InfoRow
                        label={t('hostInfo_containers')}
                        value={`${host.dockerContainersRunning}/${host.dockerContainers}`}
                        labelKey="containers"
                      />
                    ) : null}
                    {host.dockerImages ? <InfoRow label={t('hostInfo_images')} value={String(host.dockerImages)} labelKey="images" /> : null}
                    {host.environment?.connectionType ? (
                      <InfoRow
                        label={t('hostInfo_connectionType')}
                        value={host.environment.connectionType}
                        labelKey="connectionType"
                      />
                    ) : null}
                  </View>
                ) : null}

                {system ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Icon name={sectionIcons.systemSection} size={16} color={colors.accent} />
                      <Text style={styles.sectionTitle}>{t('hostInfo_systemSection')}</Text>
                    </View>
                    {system.runtime?.runtimeName ? (
                      <InfoRow
                        label={t('hostInfo_runtime')}
                        value={`${system.runtime.runtimeName}${system.runtime.platform ? ` (${system.runtime.platform})` : ''}`}
                        labelKey="runtime"
                      />
                    ) : null}
                    {system.docker?.version ? (
                      <InfoRow
                        label={t('hostInfo_dockerApi')}
                        value={`${system.docker.version}${system.docker.apiVersion ? ` (API ${system.docker.apiVersion})` : ''}`}
                        labelKey="dockerApi"
                      />
                    ) : null}
                    {system.database?.type ? (
                      <InfoRow
                        label={t('hostInfo_database')}
                        value={`${system.database.type}${system.database.schemaVersion ? ` (schema ${system.database.schemaVersion})` : ''}`}
                        labelKey="database"
                      />
                    ) : null}
                    {system.stats ? (
                      <>
                        {system.stats.containers ? (
                          <InfoRow
                            label={t('hostInfo_statsContainers')}
                            value={`${system.stats.containers.running ?? 0}/${system.stats.containers.total ?? 0}`}
                            labelKey="statsContainers"
                          />
                        ) : null}
                        {typeof system.stats.images === 'number' ? (
                          <InfoRow label={t('hostInfo_statsImages')} value={String(system.stats.images)} labelKey="statsImages" />
                        ) : null}
                        {typeof system.stats.volumes === 'number' ? (
                          <InfoRow label={t('hostInfo_statsVolumes')} value={String(system.stats.volumes)} labelKey="statsVolumes" />
                        ) : null}
                        {typeof system.stats.networks === 'number' ? (
                          <InfoRow label={t('hostInfo_statsNetworks')} value={String(system.stats.networks)} labelKey="statsNetworks" />
                        ) : null}
                        {typeof system.stats.stacks === 'number' ? (
                          <InfoRow label={t('hostInfo_statsStacks')} value={String(system.stats.stacks)} labelKey="statsStacks" />
                        ) : null}
                      </>
                    ) : null}
                  </View>
                ) : null}

                {!host && !system && !error ? (
                  <View style={styles.noDataWrap}>
                    <Icon name="information" size={28} color={colors.textMuted} />
                    <Text style={styles.muted}>{t('hostInfo_noData')}</Text>
                  </View>
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
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800', flex: 1 },
  subtitle: { color: colors.textDim, fontSize: 13, marginBottom: 4 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { gap: 16 },
  loadingWrap: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  loadingIcon: { marginBottom: 4 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  error: { color: colors.red, fontSize: 14, flex: 1 },
  noDataWrap: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  muted: { color: colors.textDim, fontSize: 14 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { color: colors.accent, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  rowIcon: { marginTop: 1, marginRight: 4 },
  rowLabel: { color: colors.textDim, fontSize: 13, minWidth: 120, fontWeight: '600' },
  rowValue: { color: colors.text, fontSize: 13, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
});