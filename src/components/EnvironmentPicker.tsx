import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { DockhandEnvironment } from '../types';
import { useSettings } from '../state/SettingsContext';
import { alpha, colors, radius } from '../theme';
import { Icon } from './Icon';
import { IconButton } from './ui';
import { Text } from './Text';

interface Props {
  visible: boolean;
  environments: DockhandEnvironment[];
  currentEnvId: string | null;
  loading: boolean;
  onSelect: (env: DockhandEnvironment) => void;
  onClose: () => void;
}

/** Enkel miljøvelger som en bunnmeny. */
export function EnvironmentPicker({
  visible,
  environments,
  currentEnvId,
  onSelect,
  onClose,
  loading,
}: Props) {
  const { t } = useSettings();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings_switchEnv')}</Text>
          <IconButton icon="close" size={18} accessibilityLabel={t('common_close')} onPress={onClose} variant="ghost" />
        </View>
        {loading && environments.length === 0 ? (
          <Text style={styles.empty}>{t('env_loading')}</Text>
        ) : environments.length === 0 ? (
          <Text style={styles.empty}>{t('env_empty')}</Text>
        ) : (
          environments.map((env) => {
            const active = env.id === currentEnvId;
            return (
              <Pressable
                key={env.id}
                accessibilityRole="button"
                testID={`env-option-${env.id}`}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => onSelect(env)}
              >
                <View style={styles.optionContent}>
                  <Icon name="server" size={18} color={active ? colors.accent : colors.text} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {env.name}
                  </Text>
                </View>
                {active ? <Icon name="check" size={18} color={colors.accent} style={styles.check} /> : null}
              </Pressable>
            );
          })
        )}
        <Pressable style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>{t('common_cancel')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionActive: { backgroundColor: alpha(colors.accent, 0.15) },
  optionPressed: { backgroundColor: colors.surfaceAlt },
  optionText: { color: colors.text, fontSize: 16 },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  check: { marginLeft: 8 },
  empty: { color: colors.textDim, paddingVertical: 16, textAlign: 'center' },
  cancel: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
});