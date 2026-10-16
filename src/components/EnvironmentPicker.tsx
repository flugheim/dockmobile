import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DockhandEnvironment } from '../types';
import { useSettings } from '../state/SettingsContext';
import { colors, radius } from '../theme';

interface Props {
  visible: boolean;
  environments: DockhandEnvironment[];
  currentEnvId: string | null;
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
}: Props) {
  const { t } = useSettings();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('settings_switchEnv')}</Text>
        {environments.length === 0 ? (
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
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {env.name}
                </Text>
                {active ? <Text style={styles.check}>✓</Text> : null}
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
    marginBottom: 12,
  },
  title: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: 'rgba(36,150,237,0.15)' },
  optionPressed: { backgroundColor: colors.surfaceAlt },
  optionText: { color: colors.text, fontSize: 16 },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  check: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  empty: { color: colors.textDim, paddingVertical: 16, textAlign: 'center' },
  cancel: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
});
