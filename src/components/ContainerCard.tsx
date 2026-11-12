import { Pressable, StyleSheet, View } from 'react-native';
import type { Container } from '../types';
import { Button } from './ui';
import { Icon } from './Icon';
import { Text } from './Text';
import { alpha, colors, radius, stateColor } from '../theme';
import { containerStateLabel } from '../i18n/translations';
import { useSettings } from '../state/SettingsContext';

interface Props {
  container: Container;
  busy: boolean;
  onPress: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ContainerCard({
  container: c,
  busy,
  onPress,
  onStart,
  onStop,
  onRestart,
  onUpdate,
  onDelete,
}: Props) {
  const { t, lang } = useSettings();
  const running = c.state === 'running';
  const status = stateColor(c.state);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { borderColor: colors.accent }]}
    >
      <View style={styles.header}>
        <Icon name="cube" size={16} color={status} style={styles.leadingIcon} />
        <Text style={styles.name} numberOfLines={1}>
          {c.name}
        </Text>
        <View style={[styles.pill, { borderColor: status }]}>
          <Text style={[styles.pillText, { color: status }]}>
            {containerStateLabel(c.state, lang)}
          </Text>
        </View>
      </View>

      <Text style={styles.image} numberOfLines={1}>
        {c.image}
      </Text>
      {c.statusText && !/^(up|exited)/i.test(c.statusText) ? (
        <Text style={styles.statusText} numberOfLines={1}>
          {c.statusText}
        </Text>
      ) : null}

      {c.updateAvailable ? (
        <View style={styles.updateRow}>
          <Icon name="download" size={15} color={colors.amber} />
          <Text style={styles.updateBadge}>{t('card_updateAvailable')}</Text>
          <Button
            label={t('card_update')}
            icon="download"
            onPress={onUpdate}
            loading={busy}
            small
            testID={`update-${c.id}`}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        {running ? (
          <Button
            label={t('card_stop')}
            icon="stop"
            variant="secondary"
            small
            onPress={onStop}
            disabled={busy}
          />
        ) : (
          <Button
            label={t('card_start')}
            icon="play"
            variant="secondary"
            small
            onPress={onStart}
            disabled={busy}
          />
        )}
        <Button
          label={t('card_restart')}
          icon="restart"
          variant="secondary"
          small
          onPress={onRestart}
          disabled={busy}
        />
        <Button
          label={t('card_delete')}
          icon="trash"
          variant="danger"
          small
          onPress={onDelete}
          disabled={busy}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadingIcon: { marginTop: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '700' },
  image: { color: colors.textDim, fontSize: 13 },
  statusText: { color: colors.textMuted, fontSize: 12 },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: alpha(colors.amber, 0.1),
    borderColor: alpha(colors.amber, 0.5),
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    gap: 8,
  },
  updateBadge: { color: colors.amber, fontSize: 13, fontWeight: '600', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
});
