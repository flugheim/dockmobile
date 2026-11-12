import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter } from 'expo-router';

import { StackCard } from '../components/StackCard';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EnvironmentPicker } from '../components/EnvironmentPicker';
import { HostInfoModal } from '../components/HostInfoModal';
import { Button, EmptyState, ErrorBanner, IconButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { useSettings } from '../state/SettingsContext';
import type { ComposeStack, DockhandEnvironment } from '../types';
import { colors, radius } from '../theme';

export default function StacksScreen() {
  const { client, settings, status, environments, selectEnvironment, t, lang, refreshEnvironments } =
    useSettings();
  const router = useRouter();

  const [stacks, setStacks] = useState<ComposeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComposeStack | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deployTarget, setDeployTarget] = useState<string | null>(null);
  const [deployBusy, setDeployBusy] = useState(false);
  const [deployOpts, setDeployOpts] = useState({
    pull: true,
    build: false,
    forceRecreate: false,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentEnv = environments.find((e) => e.id === settings?.envId) ?? environments[0] ?? null;

  const load = useCallback(
    async (mode: 'init' | 'refresh' = 'init') => {
      if (!client) return;
      if (mode === 'init') setLoading(true);
      try {
        const list = await client.getStacks();
        setStacks(list);
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

  function toggleExpanded(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function openDeployModal(name: string) {
    setDeployTarget(name);
    setDeployOpts({ pull: true, build: false, forceRecreate: false });
  }

  async function runDeploy() {
    if (!client || !deployTarget) return;
    setDeployBusy(true);
    try {
      await client.deployStack(deployTarget, deployOpts);
      setDeployTarget(null);
      void load('refresh');
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setDeployBusy(false);
    }
  }

  function confirmRestart(name: string) {
    Alert.alert(t('confirmRestartTitle', { name }), t('confirmRestartMessage'), [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('common_restart'),
        style: 'destructive',
        onPress: () => {
          setBusyName(name);
          if (!client) return;
          client
            .restartStack(name)
            .then(() => {
              setTimeout(() => void load('refresh'), 1500);
            })
            .catch((e) => {
              Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
            })
            .finally(() => {
              setBusyName(null);
            });
        },
      },
    ]);
  }

  async function handleDeleteStack() {
    if (!client || !deleteTarget) return;
    setDeleteBusy(true);
    try {
      await client.deleteStack(deleteTarget.name);
      setDeleteTarget(null);
      void load('refresh');
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function onSelectEnvironment(env: DockhandEnvironment) {
    setPickerOpen(false);
    setStacks([]);
    setLoading(true);
    await selectEnvironment(env);
  }

  const sorted = useMemo(
    () => [...stacks].sort((a, b) => a.name.localeCompare(b.name)),
    [stacks],
  );

  if (status === 'disconnected') {
    return <Redirect href="/connect" />;
  }

  if (loading && stacks.length === 0) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Stack.Screen options={{ title: t('nav_stacks') }} />
        <Text style={styles.muted}>{t('list_loading')}</Text>
      </View>
    );
  }

  const timeLocale = lang === 'nb' ? 'nb-NO' : 'en-GB';

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: settings?.envName ?? t('nav_stacks'),
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
            label={t('stack_create')}
            icon="plus"
            variant="primary"
            small
            onPress={() => router.push('/create-stack')}
            testID="create-stack"
          />
          <Button
            label={t('nav_containers')}
            variant="ghost"
            small
            onPress={() => router.replace('/containers')}
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

      {error ? <ErrorBanner message={error} onRetry={() => void load('refresh')} /> : null}

      <FlatList
        data={sorted}
        keyExtractor={(s) => s.name}
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
            title={t('stack_empty')}
            hint={t('stack_emptyHint')}
            icon="cube"
          />
        }
        renderItem={({ item }) => (
          <StackCard
            stack={item}
            expanded={expanded.has(item.name)}
            busy={busyName === item.name}
            onToggle={() => toggleExpanded(item.name)}
            onDeploy={() => openDeployModal(item.name)}
            onRestart={() => confirmRestart(item.name)}
            onDelete={() => setDeleteTarget(item)}
          />
        )}
      />

      <Modal visible={!!deployTarget} transparent animationType="fade" onRequestClose={() => setDeployTarget(null)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setDeployTarget(null)}>
          <Pressable style={modalStyles.card} onPress={() => {}}>
            <View style={modalStyles.header}>
              <Icon name="play" size={20} color={colors.accent} />
              <Text style={modalStyles.title}>{t('stack_deployOptionsTitle')}</Text>
            </View>
            <Text style={modalStyles.stackName}>{deployTarget}</Text>

            <View style={modalStyles.row}>
              <View style={modalStyles.switchRow}>
                <Icon name="download" size={18} color={colors.accent} />
                <Text style={modalStyles.label}>{t('stack_deployPull')}</Text>
              </View>
              <Switch
                value={deployOpts.pull}
                onValueChange={(v) => setDeployOpts((o) => ({ ...o, pull: v }))}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={modalStyles.row}>
              <View style={modalStyles.switchRow}>
                <Icon name="cube" size={18} color={colors.accent} />
                <Text style={modalStyles.label}>{t('stack_deployBuild')}</Text>
              </View>
              <Switch
                value={deployOpts.build}
                onValueChange={(v) => setDeployOpts((o) => ({ ...o, build: v }))}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={modalStyles.row}>
              <View style={modalStyles.switchRow}>
                <Icon name="restart" size={18} color={colors.amber} />
                <Text style={modalStyles.label}>{t('stack_deployForceRecreate')}</Text>
              </View>
              <Switch
                value={deployOpts.forceRecreate}
                onValueChange={(v) => setDeployOpts((o) => ({ ...o, forceRecreate: v }))}
                trackColor={{ false: colors.border, true: colors.amber }}
                thumbColor="#fff"
              />
            </View>

            <View style={modalStyles.actions}>
              <Button label={t('common_cancel')} variant="secondary" small onPress={() => setDeployTarget(null)} disabled={deployBusy} />
              <Button
                label={t('stack_deployRun')}
                icon="play"
                variant="primary"
                small
                loading={deployBusy}
                disabled={deployBusy}
                onPress={() => void runDeploy()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDeleteModal
        visible={!!deleteTarget}
        expectedName={deleteTarget?.name ?? ''}
        title={t('delete_stackTitle')}
        message={t('delete_stackMessage')}
        busy={deleteBusy}
        onConfirm={() => void handleDeleteStack()}
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
  list: { paddingHorizontal: 16, paddingBottom: 32 },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800', flex: 1 },
  stackName: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: colors.text, fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});