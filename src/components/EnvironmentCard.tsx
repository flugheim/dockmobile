import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { useSettings } from '../state/SettingsContext';
import type { EnvironmentOverview } from '../types';

interface Props {
  overview: EnvironmentOverview;
  isActive: boolean;
  onPress: () => void;
}

export function EnvironmentCard({ overview, isActive, onPress }: Props) {
  const { t } = useSettings();
  const { environment, totalContainers, runningContainers, stoppedContainers, updatesAvailable, loading, error } =
    overview;

  const isOffline = !!error;

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
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOffline ? colors.red : colors.green },
            ]}
          />
          <Text style={styles.envName} numberOfLines={1}>
            {environment.name}
          </Text>
          {isActive ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Aktiv</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.statusText, { color: isOffline ? colors.red : colors.green }]}>
          {isOffline ? t('overview_envOffline') : t('overview_envOnline')}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
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
            {/* Kjører */}
            <View style={[styles.badge, styles.badgeRunning]}>
              <Text style={styles.badgeRunningText}>
                {t('overview_runningBadge', { n: runningContainers })}
              </Text>
            </View>

            {/* Stoppet */}
            {stoppedContainers > 0 ? (
              <View style={[styles.badge, styles.badgeStopped]}>
                <Text style={styles.badgeStoppedText}>
                  {t('overview_stoppedBadge', { n: stoppedContainers })}
                </Text>
              </View>
            ) : null}

            {/* Oppdateringer */}
            {updatesAvailable > 0 ? (
              <View style={[styles.badge, styles.badgeUpdates]}>
                <Text style={styles.badgeUpdatesText}>
                  {t('overview_updatesBadge', { n: updatesAvailable })}
                </Text>
              </View>
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
            <Text style={styles.tapPrompt}>{t('overview_tapToOpen')} →</Text>
          </View>
        </View>
      )}
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
    borderColor: colors.accent,
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  envName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  activeBadge: {
    backgroundColor: 'rgba(36,150,237,0.18)',
    borderColor: colors.accent,
    borderWidth: 1,
    paddingHorizontal: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeRunning: {
    backgroundColor: 'rgba(63,185,80,0.12)',
    borderColor: colors.green,
  },
  badgeRunningText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeStopped: {
    backgroundColor: 'rgba(248,81,73,0.12)',
    borderColor: colors.red,
  },
  badgeStoppedText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeUpdates: {
    backgroundColor: 'rgba(210,153,34,0.14)',
    borderColor: colors.amber,
  },
  badgeUpdatesText: {
    color: colors.amber,
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
  },
  totalText: {
    color: colors.textDim,
    fontSize: 13,
  },
  tapPrompt: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(248,81,73,0.08)',
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 10,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
  },
  loadingBox: {
    paddingVertical: 8,
  },
  mutedText: {
    color: colors.textDim,
    fontSize: 13,
  },
});
