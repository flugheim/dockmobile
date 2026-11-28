/**
 * Tema-hooks. `useTheme()` gir gjeldende palett (valgt i innstillingene), og
 * `useThemedStyles()` lager StyleSheet-objekter per palett og cacher dem, slik
 * at et tema-bytte ikke koster mer enn en ny stylesheet per komponent.
 */
import { useMemo } from 'react';
import { useSettings } from '../state/SettingsContext';
import { DEFAULT_THEME, palettes, themeMeta, type Palette, type ThemeName } from './palettes';

const styleCaches = new WeakMap<object, Map<Palette, unknown>>();

export interface Theme {
  colors: Palette;
  themeName: ThemeName;
  isDark: boolean;
  setThemeName: (name: ThemeName) => Promise<void>;
}

export function useTheme(): Theme {
  const { themeName, setThemeName } = useSettings();
  const name = palettes[themeName] ? themeName : DEFAULT_THEME;
  return {
    colors: palettes[name],
    themeName: name,
    isDark: themeMeta[name].isDark,
    setThemeName,
  };
}

/**
 * Lager (og cacher) en stylesheet for gjeldende palett. Send inn en fabrikk på
 * modulnivå, ikke en inline arrow, ellers blir cachen verdiløs:
 *
 *   const makeStyles = (colors: Palette) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => {
    let cache = styleCaches.get(factory);
    if (!cache) {
      cache = new Map();
      styleCaches.set(factory, cache);
    }
    const cached = cache.get(colors);
    if (cached !== undefined) return cached as T;
    const created = factory(colors);
    cache.set(colors, created);
    return created;
  }, [factory, colors]);
}
