import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Container } from '../types';
import { Button } from './ui';
import { colors, radius, stateColor, stateLabel } from '../theme';

interface Props {
  container: Container;
  busy: boolean;
  onPress: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onUpdate: () => void;
}

export function ContainerCard({
  container: c,
  busy,
  onPress,
  onStart,
  onStop,
  onRestart,
  onUpdate,
}: Props) {
  const running = c.state === 'running';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { borderColor: colors.accent }]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: stateColor(c.state) }]} />
        <Text style={styles.name} numberOfLines={1}>
          {c.name}
        </Text>
        <View style={[styles.pill, { borderColor: stateColor(c.state) }]}>
          <Text style={[styles.pillText, { color: stateColor(c.state) }]}>
            {stateLabel(c.state)}
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
          <Text style={styles.updateBadge}>⬆ Oppdatering tilgjengelig</Text>
          <Button
            label="Oppdater"
            onPress={onUpdate}
            loading={busy}
            small
            testID={`update-${c.id}`}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        {running ? (
          <Button label="Stopp" variant="secondary" small onPress={onStop} disabled={busy} />
        ) : (
          <Button label="Start" variant="secondary" small onPress={onStart} disabled={busy} />
        )}
        <Button
          label="Omstart"
          variant="secondary"
          small
          onPress={onRestart}
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
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '700' },
  image: { color: colors.textDim, fontSize: 13 },
  statusText: { color: colors.textDim, fontSize: 12 },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(210,153,34,0.12)',
    borderColor: colors.amber,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    gap: 8,
  },
  updateBadge: { color: colors.amber, fontSize: 13, fontWeight: '600', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
