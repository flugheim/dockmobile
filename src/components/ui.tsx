import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
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
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
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
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : colors.text} />
      ) : (
        <Text
          style={[
            styles.label,
            small && styles.labelSmall,
            variant === 'primary' ? styles.labelOnPrimary : styles.labelOnSurface,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
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
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '600' },
  labelSmall: { fontSize: 13, fontWeight: '600' },
  labelOnPrimary: { color: '#fff' },
  labelOnSurface: { color: colors.text },
});

const variants: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.red },
  ghost: { backgroundColor: 'transparent' },
};

/** Enkel placeholder når det ikke er noe å vise. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={empty.wrap}>
      <Text style={empty.title}>{title}</Text>
      {hint ? <Text style={empty.hint}>{hint}</Text> : null}
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { color: colors.textDim, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  hint: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
});

/** Feilbanner med valgfri mulighet for å prøve igjen. */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={err.wrap}>
      <Text style={err.text}>{message}</Text>
      {onRetry ? (
        <Button label="Prøv igjen" variant="secondary" small onPress={onRetry} />
      ) : null}
    </View>
  );
}

const err = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(248,81,73,0.12)',
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 18 },
});
