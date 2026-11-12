import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button } from './ui';
import { useSettings } from '../state/SettingsContext';
import { Icon } from './Icon';
import { Text } from './Text';
import { colors, radius } from '../theme';

interface Props {
  visible: boolean;
  expectedName: string;
  title: string;
  message: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  visible,
  expectedName,
  title,
  message,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useSettings();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setTyped('');
  }, [visible]);

  const matches = typed.trim() === expectedName.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Icon name="warning" size={22} color={colors.red} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.hintWrap}>
            <Icon name="key" size={14} color={colors.amber} />
            <Text style={styles.hint}>
              {t('delete_confirmHint', { name: expectedName })}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            value={typed}
            onChangeText={setTyped}
            placeholder={expectedName}
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          <View style={styles.actions}>
            <Button label={t('common_cancel')} variant="secondary" small onPress={onCancel} disabled={busy} />
            <Button
              label={t('common_delete')}
              icon="trash"
              variant="danger"
              small
              onPress={onConfirm}
              disabled={!matches || busy}
              loading={busy}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  message: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  hintWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  hint: { color: colors.amber, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgDeep,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});