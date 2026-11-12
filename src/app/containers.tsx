import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter, useFocusEffect } from 'expo-router';

import { ContainerCard } from '../components/ContainerCard';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EnvironmentPicker } from '../components/EnvironmentPicker';
import { HostInfoModal } from '../components/HostInfoModal';
import { Button, EmptyState, ErrorBanner, IconButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { useSettings } from '../state/SettingsContext';
import type { TransKey } from '../i18n/translations';
import type { Container, DockhandEnvironment } from '../types';
import { alpha, colors, radius } from '../theme';

type Filter = 'all' | 'running' | 'stopped' | 'updates';

const FILTERS: { key: Filter; labelKey: TransKey }[] = [
  { key: 'all', labelKey: 'filter_all' },
  { key: 'running', labelKey: 'filter_running' },
  { key: 'stopped', labelKey: 'filter_stopped' },
  { key: 'updates', labelKey: 'filter_updates' },
];

export default function ContainersScreen() {
  const { client, settings, status, environments, selectEnvironment, t, lang, refreshEnvironments } =
    useSettings();
  const router = useRouter();

  const [containers, setContainers] = useState<Container[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Container | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [updateIds, setUpdateIds] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentEnv = environments.find((e) => e.id === settings?.envId) ?? environments[0] ?? null;

  const filtered = useMemo(() => {
    switch (filter) {
      case 'running':
        return containers.filter((c) => c.state === 'running');
      case 'stopped':
        return containers.filter((c) => c.state !== 'running');
      case 'updates':
        return containers.filter((c) => c.updateAvailable);
      default:
        return containers;
    }
  }, [containers, filter]);

  const withUpdates = useMemo(() => containers.filter((c) => c.updateAvailable), [containers]);

  const load = useCallback(
    async (mode: 'init' | 'refresh' = 'init') => {
      if (!client) return;
      if (mode === 'init') setLoading(true);
      try {
        const [list, pending] = await Promise.all([
          client.getContainers(),
          client.getPendingUpdates().catch(() => []),
        ]);
        const pendingIds = new Set(pending.map((c) => c.id));
        for (const c of list) {
          if (c.updateAvailable) pendingIds.add(c.id);
        }
        setContainers(
          list.map((c) => ({
            ...c,
            updateAvailable: c.updateAvailable || pendingIds.has(c.id),
          })),
        );
        setUpdateIds(pendingIds);
        setError(null);
        setLastUpdated(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client],
  );

  useFocusEffect(
    useCallback(() => {
      void load('init');
    }, [load]),
  );

  async function checkForUpdates() {
    if (!client) return;
    setCheckingUpdates(true);
    try {
      const pending = await client.getPendingUpdates();
      const pendingIds = new Set(pending.map((c) => c.id));
      for (const c of containers) {
        if (c.updateAvailable) pendingIds.add(c.id);
      }
      setContainers((prev) =>
        prev.map((c) => ({
          ...c,
          updateAvailable: pendingIds.has(c.id),
        })),
      );
      setUpdateIds(pendingIds);
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setCheckingUpdates(false);
    }
  }

  async function updateContainers(ids: string[]) {
    if (!client) return;
    setUpdatingAll(true);
    try {
      await client.updateContainers(ids);
      void load('refresh');
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatingAll(false);
    }
  }

  function confirmUpdateAll() {
    Alert.alert(
      t('confirmUpdateAllTitle'),
      withUpdates.length === 1
        ? t('confirmUpdateAll_one')
        : t('confirmUpdateAll_other', { n: withUpdates.length }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('updateAll'),
          style: 'destructive',
          onPress: () => void updateContainers(withUpdates.map((c) => c.id)),
        },
      ],
    );
  }

  async function onSelectEnvironment(env: DockhandEnvironment) {
    setPickerOpen(false);
    setContainers([]);
    setUpdateIds(new Set());
    setLoading(true);
    await selectEnvironment(env);
  }

  async function handleDeleteContainer() {
    if (!client || !deleteTarget) return;
    setDeleteBusy(true);
    try {
      await client.deleteContainer(deleteTarget.id);
      setDeleteTarget(null);
      void load('refresh');
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  function runAction(id: string, action: () => Promise<void>) {
    setBusyId(id);
    action()
      .then(() => {
        setTimeout(() => void load('refresh'), 1200);
      })
      .catch((e) => {
        Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setBusyId(null);
      });
  }

  if (status === 'disconnected') {
    return <Redirect href="/connect" />;
  }

  if (loading && containers.length === 0) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Stack.Screen options={{ title: t('nav_containers') }} />
        <Text style={styles.muted}>{t('list_loading')}</Text>
      </View>
    );
  }

  const timeLocale = lang === 'nb' ? 'nb-NO' : 'en-GB';

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: settings?.envName ?? t('nav_containers'),
          headerRight: () => (
            <Button
              label={t('nav_settings')}
              variant="ghost"
              small
              onPress={() => router.push('/settings')}
            />
          ),
        }}
      />
      <View style={styles.topBar}>
        <Pressable
          style={styles.envButton}
          onPress={() => {
            void refreshEnvironments();
            setPickerOpen(true);
          }}
          testID="env-switcher"
        >
          <View style={styles.topBarText}>
            <Text style={styles.envName} numberOfLines={1}>
              {settings?.envName ?? t('list_envFallback')}
            </Text>
            <Text style={styles.meta}>
              {lastUpdated
                ? t('list_updatedAt', {
                    time: lastUpdated.toLocaleTimeString(timeLocale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  })
                : ' '}
            </Text>
          </View>
          <IconButton
            icon="chevronDown"
            size={14}
            accessibilityLabel={t('settings_switchEnv')}
            onPress={() => {
              void refreshEnvironments();
              setPickerOpen(true);
            }}
            variant="ghost"
          />
        </Pressable>
        <View style={styles.topBarActions}>
          <IconButton
            icon="info"
            size={16}
            accessibilityLabel={t('hostInfo_title')}
            onPress={() => setInfoOpen(true)}
            variant="ghost"
            testID="info-button"
          />
          <Button
            label={t('nav_stacks')}
            variant="ghost"
            small
            onPress={() => router.push('/stacks')}
            testID="open-stacks"
          />
          <Button
            label={t('list_check')}
            icon="refresh"
            variant="secondary"
            small
            loading={checkingUpdates}
            onPress={() => void checkForUpdates()}
            testID="check-updates"
          />
        </View>
      </View>

      <EnvironmentPicker
        visible={pickerOpen}
        environments={environments}
        currentEnvId={settings?.envId ?? null}
        loading={environmentsLoading}
        onSelect={(env) => void onSelectEnvironment(env)}
        onClose={() => setPickerOpen(false)}
      />

      <HostInfoModal visible={infoOpen} environment={currentEnv} onClose={() => setInfoOpen(false)} />

      {withUpdates.length > 0 ? (
        <View style={styles.updateBanner}>
          <Icon name="download" size={16} color={colors.amber} />
          <Text style={styles.updateBannerText}>
            {withUpdates.length === 1
              ? t('banner_one')
              : t('banner_other', { n: withUpdates.length })}
          </Text>
          <Button
            label={t('updateAll')}
            icon="download"
            small
            loading={updatingAll}
            onPress={confirmUpdateAll}
            testID="update-all"
          />
        </View>
      ) : null}

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            label={t(f.labelKey)}
            variant={filter === f.key ? 'primary' : 'secondary'}
            small
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void load('refresh')} /> : null}

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={filter === 'updates' ? t('empty_updates') : t('empty_containers')}
            hint={
              filter === 'updates' ? t('empty_updatesHint') : t('empty_containersHint')
            }
            icon={filter === 'updates' ? 'download' : 'cube'}
          />
        }
        renderItem={({ item }) => (
          <ContainerCard
            container={item}
            busy={busyId === item.id}
            onPress={() => router.push(`/container/${item.id}`)}
            onStart={() => void runAction(item.id, () => client!.startContainer(item.id))}
            onStop={() => {
              Alert.alert(t('confirmStopTitle', { name: item.name }), t('confirmStopMessage'), [
                { text: t('common_cancel'), style: 'cancel' },
                {
                  text: t('common_stop'),
                  style: 'destructive',
                  onPress: () => void runAction(item.id, () => client!.stopContainer(item.id)),
                },
              ]);
            }}
            onRestart={() => void runAction(item.id, () => client!.restartContainer(item.id))}
            onUpdate={() => void updateContainers([item.id])}
            onDelete={() => setDeleteTarget(item)}
          />
        )}
      />

      <ConfirmDeleteModal
        visible={!!deleteTarget}
        expectedName={deleteTarget?.name ?? ''}
        title={t('delete_containerTitle')}
        message={t('delete_containerMessage')}
        busy={deleteBusy}
        onConfirm={() => void handleDeleteContainer()}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textDim },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  topBarText: { flex: 1 },
  envButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  envName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  updateBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: alpha(colors.amber, 0.5),
    backgroundColor: alpha(colors.amber, 0.1),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateBannerText: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '600' },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: 'wrap',
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
});