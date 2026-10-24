import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComposeStack } from '../types';

import { useSettings } from '../state/SettingsContext';
import { colors, radius, stackStatusColor, stackHealthColor, stateColor } from '../theme';
import {
  containerStateLabel,
  stackHealthLabel,
  stackSourceLabel,
  stackStatusLabel,
} from '../i18n/translations';

interface Props {
  stack: ComposeStack;
  expanded: boolean;
  onToggle: () => void;
}

export function StackCard({ stack, expanded, onToggle }: Props) {
  const { t, lang } = useSettings();
  const hasContainers = stack.containers.length > 0;
  const statusColor = stackStatusColor(stack.status);

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
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={styles.name} numberOfLines={1}>
          {stack.name}
        </Text>
        <View style={[styles.pill, { borderColor: statusColor }]}>
          <Text style={[styles.pillText, { color: statusColor }]}>
            {stackStatusLabel(stack.status, lang)}
          </Text>
        </View>
        {hasContainers ? <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text> : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {stack.containerCount === 0
            ? t('stack_noContainers')
            : t('stack_containers', { running: stack.runningCount, total: stack.containerCount })}
        </Text>
        {stack.updateCount > 0 ? (
          <Text style={styles.updateText}>{t('stack_updates_other', { n: stack.updateCount })}</Text>
        ) : null}
        {stack.health !== 'none' ? (
          <Text style={[styles.healthText, { color: stackHealthColor(stack.health) }]}>
            {stackHealthLabel(stack.health, lang)}
          </Text>
        ) : null}
        {stack.sourceType ? (
          <Text style={styles.sourceText}>{stackSourceLabel(stack.sourceType, lang)}</Text>
        ) : null}
      </View>

      {expanded && hasContainers ? (
        <View style={styles.containerList}>
          {stack.containers.map((c) => (
            <View key={c.id} style={styles.containerRow}>
              <View style={[styles.dot, styles.smallDot, { backgroundColor: stateColor(c.state) }]} />
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
                  <Text style={styles.updateBadge}>{t('card_update')}</Text>
                ) : null}
                <Text style={styles.containerState}>{containerStateLabel(c.state, lang)}</Text>
              </View>
            </View>
          ))}
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
  dot: { width: 10, height: 10, borderRadius: 5 },
  smallDot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '700' },
  chevron: { color: colors.textDim, fontSize: 16, marginLeft: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaText: { color: colors.textDim, fontSize: 12 },
  updateText: { color: colors.amber, fontSize: 12, fontWeight: '600' },
  healthText: { fontSize: 12, fontWeight: '600' },
  sourceText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  containerList: { marginTop: 4, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  containerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  containerInfo: { flex: 1, gap: 2 },
  containerService: { color: colors.text, fontSize: 13, fontWeight: '600' },
  containerImage: { color: colors.textDim, fontSize: 11 },
  containerRight: { alignItems: 'flex-end', gap: 2 },
  updateBadge: { color: colors.amber, fontSize: 10, fontWeight: '700' },
  containerState: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
});