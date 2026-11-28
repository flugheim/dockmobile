/**
 * Fargepaletter for appen. Hver palett har nøyaktig de samme fargenavnene, slik
 * at komponentene kan lese dem via `useTheme()` og bytte tema uten omlasting.
 *
 * Alle verdier er `#rrggbb` (ingen `rgba`), fordi `alpha()` i `./index.ts`
 * forutsetter hex. Gjennomsiktige varianter lages med `alpha(colors.x, 0.5)`.
 */
export interface Palette {
  /** Bakgrunn for skjermer. */
  bg: string;
  /** Ekstra dyp bakgrunn (loggvindu, innfelt innhold). */
  bgDeep: string;
  /** Kort og flater. */
  surface: string;
  /** Hevet/valgt flate, f.eks. aktivt miljø. */
  surfaceAlt: string;
  border: string;
  /** Brødtekst. */
  text: string;
  /** Dempet tekst (etiketter, metadata). */
  textDim: string;
  /** Sterkt dempet tekst (hint, plassholdere). */
  textMuted: string;
  accent: string;
  green: string;
  red: string;
  amber: string;
  /** Halvgjennomsiktig bakgrunn bak modaler. */
  overlay: string;
}

/** Tokyo Night – Omarchys standardpalett og appens opprinnelige tema. */
const tokyoNight: Palette = {
  bg: '#1a1b26',
  bgDeep: '#13141c',
  surface: '#24283b',
  surfaceAlt: '#292e42',
  border: '#3b4261',
  text: '#c0caf5',
  textDim: '#a9b1d6',
  textMuted: '#565f89',
  accent: '#7aa2f7',
  green: '#9ece6a',
  red: '#f7768e',
  amber: '#e0af68',
  overlay: 'rgba(11, 12, 18, 0.78)',
};

/** Dracula – mørk lilla palett (https://draculatheme.com). */
const dracula: Palette = {
  bg: '#282a36',
  bgDeep: '#1e1f29',
  surface: '#343746',
  surfaceAlt: '#44475a',
  border: '#4d5066',
  text: '#f8f8f2',
  textDim: '#bfc2d1',
  textMuted: '#6272a4',
  accent: '#bd93f9',
  green: '#50fa7b',
  red: '#ff5555',
  amber: '#f1fa8c',
  overlay: 'rgba(30, 31, 41, 0.82)',
};

/** Nord – kjølig blå/teal palett (https://www.nordtheme.com). */
const nord: Palette = {
  bg: '#2e3440',
  bgDeep: '#272c36',
  surface: '#3b4252',
  surfaceAlt: '#434c5e',
  border: '#4c566a',
  text: '#eceff4',
  textDim: '#d8dee9',
  textMuted: '#7b88a1',
  accent: '#88c0d0',
  green: '#a3be8c',
  red: '#bf616a',
  amber: '#ebcb8b',
  overlay: 'rgba(39, 44, 54, 0.82)',
};

export const palettes = { tokyoNight, dracula, nord } satisfies Record<string, Palette>;

export type ThemeName = keyof typeof palettes;

/** Rekkefølgen temaene vises i innstillingene. */
export const THEME_NAMES = Object.keys(palettes) as ThemeName[];

export const DEFAULT_THEME: ThemeName = 'tokyoNight';

interface ThemeMeta {
  /** Navnet som vises i innstillingene (egennavn, oversettes ikke). */
  label: string;
  /** Mørk palett -> lyse ikoner i statuslinjen. */
  isDark: boolean;
}

export const themeMeta: Record<ThemeName, ThemeMeta> = {
  tokyoNight: { label: 'Tokyo Night', isDark: true },
  dracula: { label: 'Dracula', isDark: true },
  nord: { label: 'Nord', isDark: true },
};

/** Er `value` et tema vi kjenner? Brukes ved lesing av lagret valg. */
export function isThemeName(value: string | null | undefined): value is ThemeName {
  return !!value && Object.prototype.hasOwnProperty.call(palettes, value);
}
