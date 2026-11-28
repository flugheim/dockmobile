import { Pressable, StyleSheet, View } from 'react-native';
import type { Container } from '../types';
import { Button } from './ui';
import { Icon } from './Icon';
import { Text } from './Text';
import { alpha, radius, stateColor } from '../theme';
import type { Palette } from '../theme/palettes';
import { useTheme, useThemedStyles } from '../theme/styles';
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
  onReleaseNotes?: () => void;
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
  onReleaseNotes,
  onDelete,
}: Props) {
  const { t, lang } = useSettings();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const running = c.state === 'running';
  const status = stateColor(colors, c.state);
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
        <View style={styles.updatePanel}>
          <View style={styles.updateHeading}>
            <Icon name="download" size={15} color={colors.amber} />
            <Text style={styles.updateBadge}>{t('card_updateAvailable')}</Text>
          </View>
          <View style={styles.updateActions}>
            <Button
              label={t('card_update')}
              icon="download"
              onPress={onUpdate}
              loading={busy}
              small
              testID={`update-${c.id}`}
            />
            {onReleaseNotes ? (
              <Button
                label={t('card_releaseNotes')}
                icon="link"
                variant="secondary"
                onPress={onReleaseNotes}
                small
                testID={`release-notes-${c.id}`}
              />
            ) : null}
          </View>
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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 11,
    marginBottom: 9,
    gap: 5,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leadingIcon: { marginTop: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', flex: 1 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  pillText: { fontSize: 10, fontWeight: '700' },
  image: { color: colors.textDim, fontSize: 11 },
  statusText: { color: colors.textMuted, fontSize: 10 },
  updatePanel: {
    backgroundColor: alpha(colors.amber, 0.1),
    borderColor: alpha(colors.amber, 0.5),
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 3,
    gap: 5,
    flexGrow: 0,
    flexShrink: 0,
  },
  updateHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  updateBadge: { color: colors.amber, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' },
});
