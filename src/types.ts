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

export interface ContainerInspect {
  Id?: string;
  Name?: string;
  Image?: string;
  Created?: string;
  State?: {
    Status?: string;
    Running?: boolean;
    StartedAt?: string;
    FinishedAt?: string;
    ExitCode?: number;
    Health?: { Status?: string };
  };
  RestartCount?: number;
  Config?: {
    Image?: string;
    Env?: string[];
    Labels?: Record<string, string>;
  };
  HostConfig?: {
    RestartPolicy?: { Name?: string; MaximumRetryCount?: number };
    Memory?: number;
    NanoCpus?: number;
  };
  NetworkSettings?: {
    Ports?: Record<string, { HostIp?: string; HostPort?: string }[] | null>;
    Networks?: Record<string, { IPAddress?: string }>;
  };
  Mounts?: { Type?: string; Source?: string; Destination?: string; Mode?: string; RW?: boolean }[];
  divergence?: { env?: string[]; labels?: string[] };
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

/** Vertsinfo (server) som Dockhand presenterer via GET /api/host. */
export interface HostInfo {
  hostname: string;
  ipAddress: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  dockerVersion: string;
  dockerContainers: number;
  dockerContainersRunning: number;
  dockerImages: number;
  environment?: { id?: number | string; name?: string; connectionType?: string } | null;
}

/** Systeminfo som Dockhand presenterer via GET /api/system. */
export interface SystemInfo {
  docker?: { version?: string; apiVersion?: string } | null;
  host?: { name?: string; cpus?: number; memory?: number } | null;
  runtime?: { runtimeName?: string; platform?: string } | null;
  database?: { type?: string; schemaVersion?: number } | null;
  stats?: {
    containers?: { total?: number; running?: number; stopped?: number };
    images?: number;
    volumes?: number;
    networks?: number;
    stacks?: number;
  } | null;
}
