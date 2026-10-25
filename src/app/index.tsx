import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter, useFocusEffect } from 'expo-router';
import { DockhandClient } from '../api/client';
import { EnvironmentCard } from '../components/EnvironmentCard';
import { Button, EmptyState, ErrorBanner } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import type { DockhandEnvironment, EnvironmentOverview } from '../types';
import { colors, radius } from '../theme';

export default function EnvironmentsDashboardScreen() {
  const {
    settings,
    status,
    environments,
    selectEnvironment,
    t,
    refreshEnvironments,
  } = useSettings();
  const router = useRouter();

  const [overviews, setOverviews] = useState<Record<string, EnvironmentOverview>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Henter status (containere + oppdateringer) for et spesifikt miljø.
   */
  const fetchEnvOverview = useCallback(
    async (env: DockhandEnvironment, currentSettings: typeof settings): Promise<EnvironmentOverview> => {
      if (!currentSettings) {
        return {
          environment: env,
          totalContainers: 0,
          runningContainers: 0,
          stoppedContainers: 0,
          updatesAvailable: 0,
          loading: false,
          error: 'Not connected',
        };
      }

      try {
        const client = new DockhandClient({
          baseUrl: currentSettings.baseUrl,
          token: currentSettings.token,
          envId: env.id,
          timeoutMs: 12000,
        });

        const [list, pending] = await Promise.all([
          client.getContainers(),
          client.getPendingUpdates().catch(() => []),
        ]);

        const pendingIds = new Set(pending.map((c) => c.id));
        for (const c of list) {
          if (c.updateAvailable) pendingIds.add(c.id);
        }

        const totalContainers = list.length;
        const runningContainers = list.filter((c) => c.state === 'running').length;
        const stoppedContainers = list.filter((c) => c.state !== 'running').length;
        const updatesAvailable = list.filter((c) => pendingIds.has(c.id)).length;

        return {
          environment: env,
          totalContainers,
          runningContainers,
          stoppedContainers,
          updatesAvailable,
          loading: false,
          error: null,
        };
      } catch (e) {
        return {
          environment: env,
          totalContainers: 0,
          runningContainers: 0,
          stoppedContainers: 0,
          updatesAvailable: 0,
          loading: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    [],
  );

  const inFlightRef = useRef(false);
  const environmentsRef = useRef(environments);
  const settingsRef = useRef(settings);
  const openAlertShownRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Nullstill varslet når appen kommer tilbake fra bakgrunnen, slik at
  // det vises igjen neste gang appen åpnes.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current !== 'active' && next === 'active') {
        openAlertShownRef.current = false;
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    environmentsRef.current = environments;
  }, [environments]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  /**
   * Laster overviews for alle kjente miljøer.
   */
  const loadAll = useCallback(
    async (showRefreshIndicator = false, envs?: DockhandEnvironment[]) => {
      const currentEnvs = envs && envs.length > 0 ? envs : environmentsRef.current;
      const currentSettings = settingsRef.current;
      if (!currentSettings || currentEnvs.length === 0) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (showRefreshIndicator) setRefreshing(true);

      try {
        const results = await Promise.all(
          currentEnvs.map((env: DockhandEnvironment) => fetchEnvOverview(env, currentSettings)),
        );

        const newMap: Record<string, EnvironmentOverview> = {};
        for (const res of results) {
          newMap[res.environment.id] = res;
        }
        setOverviews(newMap);
        setGlobalError(null);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : String(err));
      } finally {
        inFlightRef.current = false;
        setRefreshing(false);
      }
    },
    [fetchEnvOverview],
  );

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const fresh = await refreshEnvironments();
        await loadAll(false, fresh);
      })();
    }, [refreshEnvironments, loadAll]),
  );

  // Periodisk auto-refresh hvert 30. sekund, kun mens skjermen er synlig
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        void loadAll(false);
      }, 30000);
      return () => clearInterval(timer);
    }, [loadAll]),
  );

  // Vis et varsel første gang appen åpnes og finner oppdateringer/stoppede containere
  useEffect(() => {
    if (openAlertShownRef.current) return;
    const entries = Object.values(overviews);
    if (entries.length === 0) return;

    const totalUpdates = entries.reduce((s, o) => s + o.updatesAvailable, 0);
    const totalStopped = entries.reduce((s, o) => s + o.stoppedContainers, 0);
    if (totalUpdates === 0 && totalStopped === 0) {
      openAlertShownRef.current = true;
      return;
    }

    openAlertShownRef.current = true;
    const parts: string[] = [];
    if (totalUpdates > 0) parts.push(t('openAlert_updates', { n: totalUpdates }));
    if (totalStopped > 0) parts.push(t('openAlert_stopped', { n: totalStopped }));
    Alert.alert(t('openAlert_title'), parts.join('\\n'), [
      { text: t('common_ok') },
    ]);
  }, [overviews, t]);

  // Beregn totale summerte tall på tvers av alle miljøer
  const totals = useMemo(() => {
    let totalStopped = 0;
    let totalRunning = 0;
    let totalUpdates = 0;
    let totalContainers = 0;

    for (const ov of Object.values(overviews)) {
      if (!ov.error) {
        totalStopped += ov.stoppedContainers;
        totalRunning += ov.runningContainers;
        totalUpdates += ov.updatesAvailable;
        totalContainers += ov.totalContainers;
      }
    }

    return { totalStopped, totalRunning, totalUpdates, totalContainers };
  }, [overviews]);

  const handleSelectEnv = async (env: DockhandEnvironment) => {
    await selectEnvironment(env);
    router.push('/containers');
  };

  if (status === 'disconnected') {
    return <Redirect href="/connect" />;
  }

  const items = environments.map((env) => {
    return (
      overviews[env.id] ?? {
        environment: env,
        totalContainers: 0,
        runningContainers: 0,
        stoppedContainers: 0,
        updatesAvailable: 0,
        loading: true,
        error: null,
      }
    );
  });

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: t('overview_title'),
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

      {/* Global Metrics Bar */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.green }]}>
            {totals.totalRunning}
          </Text>
          <Text style={styles.metricLabel}>{t('overview_runningTotal')}</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            totals.totalStopped > 0 && styles.metricCardAlertStopped,
          ]}
        >
          <Text
            style={[
              styles.metricNumber,
              { color: totals.totalStopped > 0 ? colors.red : colors.textDim },
            ]}
          >
            {totals.totalStopped}
          </Text>
          <Text style={styles.metricLabel}>{t('overview_stoppedTotal')}</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            totals.totalUpdates > 0 && styles.metricCardAlertUpdates,
          ]}
        >
          <Text
            style={[
              styles.metricNumber,
              { color: totals.totalUpdates > 0 ? colors.amber : colors.textDim },
            ]}
          >
            {totals.totalUpdates}
          </Text>
          <Text style={styles.metricLabel}>{t('overview_updatesTotal')}</Text>
        </View>
      </View>

      {/* Header text */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{t('nav_environments')}</Text>
          <Text style={styles.sectionSubtitle}>
            {environments.length === 1
              ? t('overview_envCount_one')
              : t('overview_envCount_other', { n: environments.length })}
          </Text>
        </View>
        {environments.length > 0 ? (
          <Button
            label={t('nav_stacks')}
            variant="ghost"
            small
            onPress={() => router.push('/stacks')}
            testID="open-stacks"
          />
        ) : null}
      </View>

      {globalError ? (
        <ErrorBanner message={globalError} onRetry={() => void loadAll(true)} />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.environment.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshEnvironments().then(() => {
                void loadAll(true);
              });
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={t('env_empty')}
            hint={t('empty_containersHint')}
          />
        }
        renderItem={({ item }) => (
          <EnvironmentCard
            overview={item}
            isActive={settings?.envId === item.environment.id}
            onPress={() => void handleSelectEnv(item.environment)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCardAlertStopped: {
    borderColor: 'rgba(248,81,73,0.35)',
    backgroundColor: 'rgba(248,81,73,0.06)',
  },
  metricCardAlertUpdates: {
    borderColor: 'rgba(210,153,34,0.35)',
    backgroundColor: 'rgba(210,153,34,0.06)',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textDim,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textDim,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
