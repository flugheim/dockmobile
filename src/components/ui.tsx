import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { alpha, colors, radius } from '../theme';
import { useSettings } from '../state/SettingsContext';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  /** Nerd Font-ikon som vises foran etiketten. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  small = false,
  icon,
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' ? colors.bgDeep : variant === 'danger' ? colors.red : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variants[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={small ? 14 : 16} color={fg} /> : null}
          <Text
            style={[styles.label, small && styles.labelSmall, { color: fg }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  size?: number;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Ikonknapp uten tekst – brukes der plassen er knapp (topplinjer, modaler). */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 17,
  variant = 'ghost',
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  const fg = variant === 'primary' ? colors.bgDeep : variant === 'danger' ? colors.red : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        variants[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={size} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  small: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '700' },
  labelSmall: { fontSize: 13, fontWeight: '700' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const variants: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: alpha(colors.red, 0.7) },
  ghost: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
};

/** Enkel placeholder når det ikke er noe å vise. */
export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <View style={empty.wrap}>
      {icon ? <Icon name={icon} size={30} color={colors.textMuted} style={empty.icon} /> : null}
      <Text style={empty.title}>{title}</Text>
      {hint ? <Text style={empty.hint}>{hint}</Text> : null}
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  icon: { marginBottom: 12 },
  title: { color: colors.textDim, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

/** Feilbanner med valgfri mulighet for å prøve igjen. */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useSettings();
  return (
    <View style={err.wrap}>
      <Icon name="warning" size={18} color={colors.red} style={err.icon} />
      <Text style={err.text}>{message}</Text>
      {onRetry ? (
        <Button
          label={t('common_retry')}
          icon="refresh"
          variant="secondary"
          small
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const err = StyleSheet.create({
  wrap: {
    backgroundColor: alpha(colors.red, 0.1),
    borderColor: alpha(colors.red, 0.55),
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { marginTop: 1 },
  text: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 19 },
});
