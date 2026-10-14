/** Felles designverdier for appen. */

export const colors = {
  bg: '#0b0e14',
  surface: '#151a23',
  surfaceAlt: '#1b2230',
  border: '#2a3345',
  text: '#e8edf4',
  textDim: '#93a0b4',
  accent: '#2496ed', // Docker-blå
  accentDim: '#1b6cab',
  green: '#3fb950',
  red: '#f85149',
  amber: '#d29922',
  overlay: 'rgba(0,0,0,0.6)',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const spacing = (n: number) => n * 4;

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
      return colors.textDim;
  }
}

/** Norsk tekst for container-tilstand. */
export function stateLabel(state: string): string {
  switch (state) {
    case 'running':
      return 'Kjører';
    case 'exited':
      return 'Stoppet';
    case 'paused':
      return 'Pauset';
    case 'created':
      return 'Opprettet';
    case 'restarting':
      return 'Starter om';
    case 'dead':
      return 'Død';
    case 'removing':
      return 'Fjernes';
    default:
      return state;
  }
}
