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
  red: '#d4757e',
  amber: '#ebcb8b',
  overlay: 'rgba(39, 44, 54, 0.82)',
};

/** Catppuccin Mocha (https://github.com/catppuccin/catppuccin). */
const catppuccin: Palette = {
  bg: '#1e1e2e',
  bgDeep: '#181825',
  surface: '#313244',
  surfaceAlt: '#45475a',
  border: '#585b70',
  text: '#cdd6f4',
  textDim: '#bac2de',
  textMuted: '#7f849c',
  accent: '#cba6f7',
  green: '#a6e3a1',
  red: '#f38ba8',
  amber: '#f9e2af',
  overlay: 'rgba(17, 17, 27, 0.82)',
};

/** Gruvbox Dark (https://github.com/morhetz/gruvbox). */
const gruvbox: Palette = {
  bg: '#282828',
  bgDeep: '#1d2021',
  surface: '#3c3836',
  surfaceAlt: '#504945',
  border: '#665c54',
  text: '#ebdbb2',
  textDim: '#d5c4a1',
  textMuted: '#928374',
  accent: '#fabd2f',
  green: '#b8bb26',
  red: '#fb4934',
  amber: '#fe8019',
  overlay: 'rgba(29, 32, 33, 0.82)',
};

/** One Dark – Atom-temaet (https://github.com/atom/one-dark-syntax). */
const oneDark: Palette = {
  bg: '#282c34',
  bgDeep: '#21252b',
  surface: '#2f343e',
  surfaceAlt: '#3e4451',
  border: '#4b5263',
  text: '#abb2bf',
  textDim: '#9da5b4',
  textMuted: '#737b8a',
  accent: '#61afef',
  green: '#98c379',
  red: '#e06c75',
  amber: '#e5c07b',
  overlay: 'rgba(33, 37, 43, 0.82)',
};

/** Rosé Pine (https://rosepinetheme.com). */
const rosePine: Palette = {
  bg: '#191724',
  bgDeep: '#14121e',
  surface: '#1f1d2e',
  surfaceAlt: '#26233a',
  border: '#403d52',
  text: '#e0def4',
  textDim: '#908caa',
  textMuted: '#6e6a86',
  accent: '#c4a7e7',
  green: '#9ccfd8',
  red: '#eb6f92',
  amber: '#f6c177',
  overlay: 'rgba(20, 18, 30, 0.82)',
};

/** Kanagawa – "wave"-varianten (https://github.com/rebelot/kanagawa.nvim). */
const kanagawa: Palette = {
  bg: '#1f1f28',
  bgDeep: '#16161d',
  surface: '#2a2a37',
  surfaceAlt: '#363646',
  border: '#54546d',
  text: '#dcd7ba',
  textDim: '#c8c093',
  textMuted: '#727169',
  accent: '#7e9cd8',
  green: '#98bb6c',
  red: '#e46876',
  amber: '#e6c384',
  overlay: 'rgba(22, 22, 29, 0.82)',
};

export const palettes = { tokyoNight, dracula, nord, catppuccin, gruvbox, oneDark, rosePine, kanagawa } satisfies Record<string, Palette>;

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
  catppuccin: { label: 'Catppuccin Mocha', isDark: true },
  gruvbox: { label: 'Gruvbox Dark', isDark: true },
  oneDark: { label: 'One Dark', isDark: true },
  rosePine: { label: 'Rosé Pine', isDark: true },
  kanagawa: { label: 'Kanagawa', isDark: true },
};

/** Er `value` et tema vi kjenner? Brukes ved lesing av lagret valg. */
export function isThemeName(value: string | null | undefined): value is ThemeName {
  return !!value && Object.prototype.hasOwnProperty.call(palettes, value);
}
