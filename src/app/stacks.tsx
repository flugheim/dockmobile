import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Redirect, Stack, useRouter, useFocusEffect } from 'expo-router';
import type { ComposeStack, DockhandEnvironment } from '../types';
import { StackCard } from '../components/StackCard';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EnvironmentPicker } from '../components/EnvironmentPicker';
import { Button, EmptyState, ErrorBanner } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import { colors, radius } from '../theme';

export default function StacksScreen() {
  const {
    client,
    settings,
    status,
    environments,
    selectEnvironment,
    t,
    lang,
    refreshEnvironments,
    environmentsLoading,
  } = useSettings();
  const router = useRouter();
  const [stacks, setStacks] = useState<ComposeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComposeStack | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deployTarget, setDeployTarget] = useState<string | null>(null);
  const [deployOpts, setDeployOpts] = useState({ pull: true, build: false, forceRecreate: false });
  const [deployBusy, setDeployBusy] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!client) return;
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'initial') setLoading(true);
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

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      void load('initial');
      void refreshEnvironments();
      const timer = setInterval(() => {
        void load('refresh');
      }, 20000);
      return () => clearInterval(timer);
    }, [load, refreshEnvironments]),
  );

  async function onSelectEnvironment(env: DockhandEnvironment) {
    setPickerOpen(false);
    setStacks([]);
    setExpanded(new Set());
    setLoading(true);
    await selectEnvironment(env);
  }

  function toggleExpanded(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function runStackAction(name: string, action: () => Promise<void>) {
    setBusyName(name);
    try {
      await action();
      setTimeout(() => void load('refresh'), 1500);
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusyName(null);
    }
  }

  function openDeployModal(name: string) {
    setDeployOpts({ pull: true, build: false, forceRecreate: false });
    setDeployTarget(name);
  }

  async function runDeploy() {
    if (!client || !deployTarget) return;
    const name = deployTarget;
    setDeployBusy(true);
    try {
      await client.deployStack(name, deployOpts);
      setDeployTarget(null);
      setTimeout(() => void load('refresh'), 1500);
    } catch (e) {
      Alert.alert(t('actionFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setDeployBusy(false);
    }
  }

  function confirmRestart(name: string) {
    Alert.alert(t('stack_restartConfirmTitle'), t('stack_restartConfirmMessage'), [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('stack_restart'),
        style: 'destructive',
        onPress: () => void runStackAction(name, () => client!.restartStack(name)),
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

  if (status === 'disconnected') {
    return <Redirect href="/connect" />;
  }

  if (loading && stacks.length === 0) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Stack.Screen options={{ title: t('nav_stacks') }} />
        <Text style={styles.muted}>{t('stack_loading')}</Text>
      </View>
    );
  }

  const timeLocale = lang === 'nb' ? 'nb-NO' : 'en-GB';

  const sorted = [...stacks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: t('nav_stacks'),
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
          testID="stacks-env-switcher"
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
            label={t('stack_create')}
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
            <Text style={modalStyles.title}>{t('stack_deployOptionsTitle')}</Text>
            <Text style={modalStyles.stackName}>{deployTarget}</Text>

            <View style={modalStyles.row}>
              <Text style={modalStyles.label}>{t('stack_deployPull')}</Text>
              <Switch value={deployOpts.pull} onValueChange={(v) => setDeployOpts((o) => ({ ...o, pull: v }))} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#fff" />
            </View>
            <View style={modalStyles.row}>
              <Text style={modalStyles.label}>{t('stack_deployBuild')}</Text>
              <Switch value={deployOpts.build} onValueChange={(v) => setDeployOpts((o) => ({ ...o, build: v }))} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#fff" />
            </View>
            <View style={modalStyles.row}>
              <Text style={modalStyles.label}>{t('stack_deployForceRecreate')}</Text>
              <Switch value={deployOpts.forceRecreate} onValueChange={(v) => setDeployOpts((o) => ({ ...o, forceRecreate: v }))} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#fff" />
            </View>

            <View style={modalStyles.actions}>
              <Button label={t('common_cancel')} variant="secondary" small onPress={() => setDeployTarget(null)} disabled={deployBusy} />
              <Button label={t('stack_deployRun')} variant="primary" small loading={deployBusy} disabled={deployBusy} onPress={() => void runDeploy()} />
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
  envButton: { flex: 1 },
  envName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  stackName: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: colors.text, fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});