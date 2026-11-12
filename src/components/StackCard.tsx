import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ComposeStack } from '../types';

import { useSettings } from '../state/SettingsContext';
import { Button, IconButton } from './ui';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { alpha, colors, radius, stackStatusColor, stackHealthColor, stateColor } from '../theme';
import {
  containerStateLabel,
  stackHealthLabel,
  stackSourceLabel,
  stackStatusLabel,
} from '../i18n/translations';

interface Props {
  stack: ComposeStack;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onDeploy: () => void;
  onRestart: () => void;
  onDelete: () => void;
}

const statusIcons: Record<string, IconName> = {
  running: 'play',
  partial: 'pause',
  restarting: 'restart',
  stopped: 'stop',
};

const healthIcons: Record<string, IconName> = {
  healthy: 'check',
  unhealthy: 'close',
  starting: 'refresh',
};

export function StackCard({ stack, expanded, busy, onToggle, onDeploy, onRestart, onDelete }: Props) {
  const { t, lang, client } = useSettings();
  const hasContainers = stack.containers.length > 0;
  const statusColor = stackStatusColor(stack.status);
  const healthColor = stackHealthColor(stack.health);
  const [envVars, setEnvVars] = useState<{ key: string; value: string; isSecret?: boolean }[] | null>(null);
  const [envRaw, setEnvRaw] = useState<string | null>(null);
  const [envLoading, setEnvLoading] = useState(false);

  useEffect(() => {
    if (!expanded || !client || envVars !== null) return;
    let cancelled = false;
    (async () => {
      setEnvLoading(true);
      try {
        const [parsed, raw] = await Promise.all([
          client.getStackEnv(stack.name).catch(() => []),
          client.getStackEnvRaw(stack.name).catch(() => ''),
        ]);
        if (!cancelled) {
          setEnvVars(parsed);
          setEnvRaw(raw || null);
        }
      } catch {
        // ignorer feil – vises tomt
      } finally {
        if (!cancelled) setEnvLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, stack.name, client, envVars]);

  const renderEnvVars = () => {
    if (envLoading) {
      return <Text style={styles.envLoading}>{t('stack_envLoading')}</Text>;
    }
    if (!envVars || envVars.length === 0) {
      return <Text style={styles.envEmpty}>{t('stack_envEmpty')}</Text>;
    }
    return (
      <View style={styles.envList}>
        {envVars.map((ev, i) => (
          <View key={i} style={styles.envRow}>
            <Text style={styles.envKey}>{ev.key}</Text>
            <Text style={styles.envValue} selectable>
              {ev.isSecret ? '********' : ev.value}
            </Text>
            {ev.isSecret ? <Text style={styles.secretBadge}>{t('stack_envSecret')}</Text> : null}
          </View>
        ))}
      </View>
    );
  };

  const renderEnvRaw = () => {
    if (!envRaw) return null;
    return (
      <View style={styles.envRawSection}>
        <Text style={styles.envRawTitle}>{t('stack_envRawTitle')}</Text>
        <Text style={styles.envRawText} selectable>
          {envRaw}
        </Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={hasContainers ? onToggle : undefined}
      accessibilityRole="button"
      accessibilityLabel={stack.name}
      accessibilityState={{ expanded }}
      style={({ pressed }) => [styles.card, pressed && hasContainers && styles.pressed]}
      testID={`stack-${stack.name}`}
    >
      <View style={styles.header}>
        <Icon name="cube" size={16} color={statusColor} style={styles.leadingIcon} />
        <Text style={styles.name} numberOfLines={1}>
          {stack.name}
        </Text>
        <View style={[styles.pill, { borderColor: statusColor }]}>
          <Icon name={statusIcons[stack.status] ?? 'circle'} size={11} color={statusColor} style={styles.pillIcon} />
          <Text style={[styles.pillText, { color: statusColor }]}>
            {stackStatusLabel(stack.status, lang)}
          </Text>
        </View>
        {hasContainers ? (
          <IconButton
            icon={expanded ? 'chevronDown' : 'chevronRight'}
            size={15}
            accessibilityLabel={expanded ? t('common_collapse') : t('common_expand')}
            onPress={onToggle}
            variant="ghost"
          />
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {stack.containerCount === 0
            ? t('stack_noContainers')
            : t('stack_containers', { running: stack.runningCount, total: stack.containerCount })}
        </Text>
        {stack.updateCount > 0 ? (
          <View style={styles.updateBadge}>
            <Icon name="download" size={11} color={colors.amber} />
            <Text style={styles.updateText}>{t('stack_updates_other', { n: stack.updateCount })}</Text>
          </View>
        ) : null}
        {stack.health !== 'none' ? (
          <View style={styles.healthBadge}>
            <Icon name={healthIcons[stack.health] ?? 'warning'} size={11} color={healthColor} />
            <Text style={[styles.healthText, { color: healthColor }]}>
              {stackHealthLabel(stack.health, lang)}
            </Text>
          </View>
        ) : null}
        {stack.sourceType ? (
          <View style={styles.sourceBadge}>
            <Icon name="github" size={11} color={colors.accent} />
            <Text style={styles.sourceText}>{stackSourceLabel(stack.sourceType, lang)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label={t('stack_deploy')}
          icon="play"
          variant="secondary"
          small
          loading={busy}
          disabled={busy}
          onPress={onDeploy}
          testID={`deploy-${stack.name}`}
        />
        <Button
          label={t('stack_restart')}
          icon="restart"
          variant="secondary"
          small
          loading={busy}
          disabled={busy}
          onPress={onRestart}
          testID={`restart-${stack.name}`}
        />
        <Button
          label={t('card_delete')}
          icon="trash"
          variant="danger"
          small
          disabled={busy}
          onPress={onDelete}
          testID={`delete-${stack.name}`}
        />
      </View>

      {expanded && hasContainers ? (
        <View style={styles.expandedContent}>
          <View style={styles.containerList}>
            {stack.containers.map((c) => (
              <View key={c.id} style={styles.containerRow}>
                <Icon name="cube" size={13} color={stateColor(c.state)} style={styles.smallIcon} />
                <View style={styles.containerInfo}>
                  <Text style={styles.containerService} numberOfLines={1}>
                    {c.service}
                  </Text>
                  <Text style={styles.containerImage} numberOfLines={1}>
                    {c.image}
                  </Text>
                </View>
                <View style={styles.containerRight}>
                  {c.updateAvailable ? (
                    <View style={styles.updateBadgeSmall}>
                      <Icon name="download" size={10} color={colors.amber} />
                      <Text style={styles.updateBadgeText}>{t('card_update')}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.containerState}>{containerStateLabel(c.state, lang)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.envSection}>
            <View style={styles.envSectionHeader}>
              <Icon name="key" size={12} color={colors.accent} />
              <Text style={styles.envSectionTitle}>{t('stack_envTitle')}</Text>
            </View>
            {renderEnvVars()}
            {renderEnvRaw()}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  pressed: { borderColor: colors.accent },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadingIcon: { marginTop: 1 },
  smallIcon: { marginTop: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillIcon: { marginTop: 1 },
  pillText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaText: { color: colors.textDim, fontSize: 12 },
  updateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: alpha(colors.amber, 0.1), borderColor: alpha(colors.amber, 0.5), borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  updateText: { color: colors.amber, fontSize: 12, fontWeight: '600' },
  healthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: alpha(colors.amber, 0.1), borderColor: alpha(colors.amber, 0.5), borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  healthText: { fontSize: 12, fontWeight: '600' },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: alpha(colors.accent, 0.1), borderColor: alpha(colors.accent, 0.5), borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  sourceText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  containerList: { marginTop: 4, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  containerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  containerInfo: { flex: 1, gap: 2 },
  containerService: { color: colors.text, fontSize: 13, fontWeight: '600' },
  containerImage: { color: colors.textDim, fontSize: 11 },
  containerRight: { alignItems: 'flex-end', gap: 4 },
  updateBadgeSmall: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: alpha(colors.amber, 0.1), borderColor: alpha(colors.amber, 0.5), borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 2 },
  updateBadgeText: { color: colors.amber, fontSize: 10, fontWeight: '700' },
  containerState: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  expandedContent: { gap: 12 },
  envSection: { gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  envSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  envSectionTitle: { color: colors.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  envLoading: { color: colors.textDim, fontSize: 12, paddingVertical: 8 },
  envEmpty: { color: colors.textDim, fontSize: 12, paddingVertical: 8 },
  envList: { gap: 6 },
  envRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  envKey: { color: colors.accent, fontSize: 12, fontWeight: '600', minWidth: 100 },
  envValue: { color: colors.text, fontSize: 12, flex: 1, fontFamily: 'monospace' },
  secretBadge: { color: colors.amber, fontSize: 10, fontWeight: '700' },
  envRawSection: { marginTop: 8, gap: 4 },
  envRawTitle: { color: colors.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  envRawText: { color: colors.text, fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
});