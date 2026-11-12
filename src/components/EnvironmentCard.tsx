import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { alpha, colors, radius } from '../theme';
import { useSettings } from '../state/SettingsContext';
import type { EnvironmentOverview } from '../types';
import { HostInfoModal } from './HostInfoModal';
import { Icon, type IconName } from './Icon';
import { IconButton } from './ui';
import { Text } from './Text';

interface Props {
  overview: EnvironmentOverview;
  isActive: boolean;
  onPress: () => void;
}

function Badge({
  icon,
  label,
  color,
}: {
  icon: IconName;
  label: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: alpha(color, 0.12), borderColor: alpha(color, 0.55) },
      ]}
    >
      <Icon name={icon} size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function EnvironmentCard({ overview, isActive, onPress }: Props) {
  const { t } = useSettings();
  const { environment, totalContainers, runningContainers, stoppedContainers, updatesAvailable, loading, error } =
    overview;
  const [infoOpen, setInfoOpen] = useState(false);

  const isOffline = !!error;
  const statusColor = isOffline ? colors.red : colors.green;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.activeCard,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={environment.name}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="server" size={17} color={statusColor} />
          <Text style={styles.envName} numberOfLines={1}>
            {environment.name}
          </Text>
          {isActive ? (
            <View style={styles.activeBadge}>
              <Icon name="check" size={11} color={colors.accent} />
              <Text style={styles.activeBadgeText}>{t('overview_active')}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.statusText, { color: statusColor }]}>
          {isOffline ? t('overview_envOffline') : t('overview_envOnline')}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Icon name="warning" size={14} color={colors.red} />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
        </View>
      ) : loading && totalContainers === 0 ? (
        <View style={styles.loadingBox}>
          <Text style={styles.mutedText}>{t('overview_loading')}</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* Container metrics badges */}
          <View style={styles.metricsRow}>
            <Badge
              icon="play"
              color={colors.green}
              label={t('overview_runningBadge', { n: runningContainers })}
            />
            {stoppedContainers > 0 ? (
              <Badge
                icon="stop"
                color={colors.red}
                label={t('overview_stoppedBadge', { n: stoppedContainers })}
              />
            ) : null}
            {updatesAvailable > 0 ? (
              <Badge
                icon="download"
                color={colors.amber}
                label={t('overview_updatesBadge', { n: updatesAvailable })}
              />
            ) : null}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.totalText}>
              {totalContainers === 0
                ? t('overview_noContainers')
                : totalContainers === 1
                  ? t('overview_containerCount_one')
                  : t('overview_containerCount_other', { n: totalContainers })}
            </Text>
            <View style={styles.footerActions}>
              <IconButton
                icon="info"
                size={15}
                accessibilityLabel={t('hostInfo_title')}
                onPress={() => setInfoOpen(true)}
              />
              <View style={styles.tapPrompt}>
                <Text style={styles.tapPromptText}>{t('overview_tapToOpen')}</Text>
                <Icon name="arrowRight" size={13} color={colors.accent} />
              </View>
            </View>
          </View>
        </View>
      )}
      <HostInfoModal visible={infoOpen} environment={environment} onClose={() => setInfoOpen(false)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  activeCard: {
    borderColor: alpha(colors.accent, 0.7),
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    opacity: 0.88,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  envName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: alpha(colors.accent, 0.15),
    borderColor: alpha(colors.accent, 0.6),
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  activeBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 8,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalText: {
    color: colors.textDim,
    fontSize: 13,
    flexShrink: 1,
  },
  tapPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapPromptText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: alpha(colors.red, 0.1),
    borderColor: alpha(colors.red, 0.5),
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 10,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  loadingBox: {
    paddingVertical: 8,
  },
  mutedText: {
    color: colors.textDim,
    fontSize: 13,
  },
});
