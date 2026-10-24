/**
 * Domene-typer for appen.
 *
 * Dockhands API returnerer ikke alltid samme form på tvers av versjoner,
 * så API-klienten normaliserer alt til disse typene.
 */

export interface DockhandEnvironment {
  id: string;
  name: string;
}

export interface EnvironmentOverview {
  environment: DockhandEnvironment;
  totalContainers: number;
  runningContainers: number;
  stoppedContainers: number;
  updatesAvailable: number;
  loading: boolean;
  error?: string | null;
}

/** En container slik appen ser den – alltid normalisert. */
export interface Container {
  id: string;
  name: string;
  image: string;
  /** running | exited | paused | created | restarting | dead | removing … */
  state: string;
  /** Lesbar statustekst fra serveren, f.eks. "Up 3 hours" */
  statusText: string;
  updateAvailable: boolean;
}

export interface StackContainer {
  id: string;
  name: string;
  service: string;
  state: string;
  image: string;
  updateAvailable: boolean;
}

export interface ComposeStack {
  name: string;
  status: string;
  health: string;
  sourceType: string | null;
  containerCount: number;
  runningCount: number;
  updateCount: number;
  containers: StackContainer[];
}

export interface LogLine {
  id: string;
  text: string;
}

export interface ConnectionSettings {
  /** Uten avsluttende skråstrek, f.eks. http://192.168.1.10:3000 */
  baseUrl: string;
  /** API-token som starter med dh_ */
  token: string;
  envId: string | null;
  envName: string | null;
}

export type ConnectionStatus = 'loading' | 'disconnected' | 'connected';
