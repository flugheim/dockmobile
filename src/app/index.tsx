import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter, useFocusEffect } from 'expo-router';
import { DockhandClient, extractUpdateIds } from '../api/client';
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
    environmentsLoading,
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

        const pendingIds = extractUpdateIds(pending);
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

  /**
   * Laster overviews for alle kjente miljøer.
   */
  const loadAll = useCallback(
    async (showRefreshIndicator = false) => {
      if (!settings || environments.length === 0) return;
      if (showRefreshIndicator) setRefreshing(true);

      // Marker alle som loading dersom vi ikke har data ennå
      setOverviews((prev) => {
        const next = { ...prev };
        for (const env of environments) {
          if (!next[env.id]) {
            next[env.id] = {
              environment: env,
              totalContainers: 0,
              runningContainers: 0,
              stoppedContainers: 0,
              updatesAvailable: 0,
              loading: true,
              error: null,
            };
          }
        }
        return next;
      });

      try {
        const results = await Promise.all(
          environments.map((env) => fetchEnvOverview(env, settings)),
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
        setRefreshing(false);
      }
    },
    [environments, settings, fetchEnvOverview],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshEnvironments();
      void loadAll();
    }, [refreshEnvironments, loadAll]),
  );

  // Periodisk auto-refresh hvert 30. sekund
  useEffect(() => {
    const timer = setInterval(() => {
      void loadAll(false);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadAll]);

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
        <Text style={styles.sectionTitle}>{t('nav_environments')}</Text>
        <Text style={styles.sectionSubtitle}>
          {environments.length === 1
            ? t('overview_envCount_one')
            : t('overview_envCount_other', { n: environments.length })}
        </Text>
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
            refreshing={refreshing || environmentsLoading}
            onRefresh={() => {
              void refreshEnvironments();
              void loadAll(true);
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
  },
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
