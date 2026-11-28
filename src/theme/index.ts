/**
 * Felles designverdier for appen.
 *
 * Fargene ligger i `./palettes.ts` og leses med `useTheme()` fra `./styles.ts`,
 * slik at temaet kan byttes uten omlasting. Her ligger bare verdier som er like
 * for alle temaer (radius, font, avstand) og hjelpefunksjoner.
 */
import type { Palette } from './palettes';

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
};

export const spacing = (n: number) => n * 4;

/**
 * Fontfamiliene som lastes i `app/_layout.tsx`. Nerd Font brukes både til
 * tekst og til ikonglyfer.
 */
export const font = {
  regular: 'JetBrainsMonoNF',
  bold: 'JetBrainsMonoNF-Bold',
};

/** Legger alfa på en `#rrggbb`-farge. */
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Farge for container-tilstand. */
export function stateColor(colors: Palette, state: string): string {
  switch (state) {
    case 'running':
      return colors.green;
    case 'exited':
    case 'dead':
      return colors.red;
    case 'paused':
    case 'restarting':
      return colors.amber;
    default:
      return colors.textMuted;
  }
}

/** Farge for stack-status. */
export function stackStatusColor(colors: Palette, status: string): string {
  switch (status) {
    case 'running':
      return colors.green;
    case 'partial':
    case 'restarting':
      return colors.amber;
    case 'stopped':
      return colors.textMuted;
    default:
      return colors.textMuted;
  }
}

/** Farge for stack-helse. */
export function stackHealthColor(colors: Palette, health: string): string {
  switch (health) {
    case 'healthy':
      return colors.green;
    case 'unhealthy':
      return colors.red;
    case 'starting':
      return colors.amber;
    default:
      return colors.textMuted;
  }
}
