/**
 * Felles designverdier for appen.
 *
 * Paletten følger Omarchys Tokyo Night-tema, og fonten er JetBrainsMono Nerd
 * Font – samme font som brukes på skrivebordet. Ikonene i appen er glyfer fra
 * Nerd Font, ikke et eget ikonbibliotek.
 */

export const colors = {
  /** Bakgrunn for skjermer. */
  bg: '#1a1b26',
  /** Ekstra dyp bakgrunn (loggvindu, innfelt innhold). */
  bgDeep: '#13141c',
  /** Kort og flater. */
  surface: '#24283b',
  /** Hevet/valgt flate, f.eks. aktivt miljø. */
  surfaceAlt: '#292e42',
  border: '#3b4261',
  /** Brødtekst. */
  text: '#c0caf5',
  /** Dempet tekst (etiketter, metadata). */
  textDim: '#a9b1d6',
  /** Sterkt dempet tekst (hint, plassholdere). */
  textMuted: '#565f89',
  accent: '#7aa2f7',
  accentDim: '#3d59a1',
  green: '#9ece6a',
  red: '#f7768e',
  amber: '#e0af68',
  orange: '#eb927b',
  magenta: '#ad8ee6',
  cyan: '#449dab',
  overlay: 'rgba(11, 12, 18, 0.78)',
};

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
export function stateColor(state: string): string {
  switch (state) {
    case 'running':
      return colors.green;
    case 'exited':
    case 'dead':
      return colors.red;
    case 'paused':
      return colors.amber;
    case 'restarting':
      return colors.amber;
    default:
      return colors.textMuted;
  }
}

/** Farge for stack-status. */
export function stackStatusColor(status: string): string {
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
export function stackHealthColor(health: string): string {
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
