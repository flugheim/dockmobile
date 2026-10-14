import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { extractUpdateIds } from '../api/client';
import { ContainerCard } from '../components/ContainerCard';
import { Button, EmptyState, ErrorBanner } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import type { Container } from '../types';
import { colors, radius } from '../theme';

type Filter = 'all' | 'running' | 'stopped' | 'updates';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'running', label: 'Kjører' },
  { key: 'stopped', label: 'Stoppet' },
  { key: 'updates', label: 'Oppdatering' },
];

export default function ContainersScreen() {
  const { client, settings, status } = useSettings();
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
    }, [load]),
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
      Alert.alert('Handling feilet', e instanceof Error ? e.message : String(e));
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
        'Oppdatering startet',
        `${ids.length === 1 ? 'Containeren' : `${ids.length} containere`} oppdateres på serveren. Listen oppdateres fortløpende.`,
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
      Alert.alert('Oppdatering feilet', e instanceof Error ? e.message : String(e));
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
      Alert.alert('Sjekk feilet', e instanceof Error ? e.message : String(e));
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
      'Oppdatere alle?',
      `${withUpdates.length} containere trekker ny image og går ned en kort stund.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Oppdater alle',
          style: 'destructive',
          onPress: () => void updateContainers(withUpdates.map((c) => c.id)),
        },
      ],
    );
  }

  if (status === 'disconnected') {
    return <Redirect href="/connect" />;
  }

  if (loading && containers.length === 0) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Text style={styles.muted}>Laster containere …</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.envName} numberOfLines={1}>
            {settings?.envName ?? 'Miljø'}
          </Text>
          <Text style={styles.meta}>
            {lastUpdated
              ? `Oppdatert ${lastUpdated.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
              : ' '}
          </Text>
        </View>
        <View style={styles.topBarActions}>
          <Button
            label="Innstillinger"
            variant="ghost"
            small
            onPress={() => router.push('/settings')}
          />
          <Button
            label="Sjekk"
            variant="secondary"
            small
            loading={checkingUpdates}
            onPress={() => void checkForUpdates()}
            testID="check-updates"
          />
        </View>
      </View>

      {withUpdates.length > 0 ? (
        <View style={styles.updateBanner}>
          <Text style={styles.updateBannerText}>
            {withUpdates.length} container{withUpdates.length === 1 ? ' har' : 'e har'} oppdatering
            tilgjengelig
          </Text>
          <Button
            label="Oppdater alle"
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
            label={f.label}
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
            title={filter === 'updates' ? 'Ingen oppdateringer' : 'Ingen containere'}
            hint={
              filter === 'updates'
                ? 'Trykk "Sjekk" for å lete etter nye images nå.'
                : 'Dra ned for å laste listen på nytt.'
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
              Alert.alert(`Stoppe ${item.name}?`, 'Containeren stoppes nå.', [
                { text: 'Avbryt', style: 'cancel' },
                {
                  text: 'Stopp',
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
