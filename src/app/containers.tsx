import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter, useFocusEffect } from 'expo-router';
import { extractUpdateIds } from '../api/client';
import { ContainerCard } from '../components/ContainerCard';
import { EnvironmentPicker } from '../components/EnvironmentPicker';
import { Button, EmptyState, ErrorBanner } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import type { TransKey } from '../i18n/translations';
import type { Container, DockhandEnvironment } from '../types';
import { colors, radius } from '../theme';

type Filter = 'all' | 'running' | 'stopped' | 'updates';

const FILTERS: { key: Filter; labelKey: TransKey }[] = [
  { key: 'all', labelKey: 'filter_all' },
  { key: 'running', labelKey: 'filter_running' },
  { key: 'stopped', labelKey: 'filter_stopped' },
  { key: 'updates', labelKey: 'filter_updates' },
];

export default function ContainersScreen() {
  const { client, settings, status, environments, selectEnvironment, t, lang, refreshEnvironments, environmentsLoading } = useSettings();
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [updateIds, setUpdateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!client) return;
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'initial') setLoading(true);
      try {
        const [list, pending] = await Promise.all([
          client.getContainers(),
          client.getPendingUpdates().catch(() => []),
        ]);
        const pendingIds = extractUpdateIds(pending);
        // Liste kan også bære flagg i seg selv
        for (const c of list) if (c.updateAvailable) pendingIds.add(c.id);
        setUpdateIds(pendingIds);
        setContainers(list.map((c) => ({ ...c, updateAvailable: pendingIds.has(c.id) })));
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
      void load('initial');
      void refreshEnvironments();
    }, [load, refreshEnvironments]),
  );

  // Auto-oppdatering av listen mens skjermen er åpen
  useEffect(() => {
    const t = setInterval(() => {
      if (!busyId && !checkingUpdates && !updatingAll) void load('refresh');
    }, 15000);
    return () => clearInterval(t);
  }, [load, busyId, checkingUpdates, updatingAll]);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

  async function runAction(id: string, action: () => Promise<void>) {
    setBusyId(id);
    try {
      await action();
      // Gi serveren et øyeblikk før vi leser tilstanden igjen
      setTimeout(() => void load('refresh'), 1200);
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
      setBusyId(null);
    }
  }

  async function updateContainers(ids: string[]) {
    if (!client || ids.length === 0) return;
    setBusyId(ids.length === 1 ? ids[0] : 'bulk');
    if (ids.length > 1) setUpdatingAll(true);
    try {
      await client.updateContainers(ids);
      Alert.alert(
        t('updateStartedTitle'),
        ids.length === 1
          ? t('updateStarted_one')
          : t('updateStarted_other', { n: ids.length }),
      );
      // Følg med på status mens oppdateringen kjører
      let ticks = 0;
      pollRef.current = setInterval(() => {
        void load('refresh');
        if (++ticks >= 12) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setBusyId(null);
          setUpdatingAll(false);
        }
      }, 5000);
    } catch (e) {
      Alert.alert(t('updateFailed'), e instanceof Error ? e.message : String(e));
      setBusyId(null);
      setUpdatingAll(false);
    }
  }

  async function checkForUpdates() {
    if (!client) return;
    setCheckingUpdates(true);
    try {
      await client.triggerUpdateCheck();
      // Sjekken kjører som jobb på serveren – poll til den er ferdig
      let ticks = 0;
      pollRef.current = setInterval(async () => {
        try {
          const pending = await client.getPendingUpdates();
          const ids = extractUpdateIds(pending);
          setUpdateIds(ids);
          setContainers((prev) => prev.map((c) => ({ ...c, updateAvailable: ids.has(c.id) })));
        } catch {
          // ignorer mellompoll
        }
        if (++ticks >= 15) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setCheckingUpdates(false);
          void load('refresh');
        }
      }, 4000);
    } catch (e) {
      Alert.alert(t('checkFailed'), e instanceof Error ? e.message : String(e));
      setCheckingUpdates(false);
    }
  }

  const filtered = useMemo(() => {
    switch (filter) {
      case 'running':
        return containers.filter((c) => c.state === 'running');
      case 'stopped':
        return containers.filter((c) => c.state !== 'running');
      case 'updates':
        return containers.filter((c) => updateIds.has(c.id));
      default:
        return containers;
    }
  }, [containers, filter, updateIds]);

  const withUpdates = containers.filter((c) => updateIds.has(c.id));

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
    await selectEnvironment(env);
    setContainers([]);
    setUpdateIds(new Set());
    void load('initial');
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
      <Stack.Screen options={{ title: settings?.envName ?? t('nav_containers') }} />
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
              {settings?.envName ?? t('list_envFallback')} ⌄
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
        </Pressable>
        <View style={styles.topBarActions}>
          <Button
            label={t('list_settings')}
            variant="ghost"
            small
            onPress={() => router.push('/settings')}
          />
          <Button
            label={t('list_check')}
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

      {withUpdates.length > 0 ? (
        <View style={styles.updateBanner}>
          <Text style={styles.updateBannerText}>
            {withUpdates.length === 1
              ? t('banner_one')
              : t('banner_other', { n: withUpdates.length })}
          </Text>
          <Button
            label={t('updateAll')}
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
          />
        )}
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
  envButton: { flex: 1 },
  envName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  updateBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: 'rgba(210,153,34,0.12)',
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
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
});
