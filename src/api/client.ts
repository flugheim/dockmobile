/**
 * Klient for Dockhands offentlige REST-API.
 *
 * Dokumentasjon: https://dockhand.pro/manual (seksjon "API reference").
 * Autentisering: Authorization: Bearer dh_...
 *
 * Appen er defensiv: svarkaner varierer mellom versjoner, så alle lesninger
 * normaliseres (se normalize* under).
 */

import type { Container, ComposeStack, ContainerInspect, DockhandEnvironment, LogLine, StackContainer } from '../types';
import { getCurrentLang, translate } from '../i18n/translations';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface DockhandClientOptions {
  baseUrl: string;
  token: string;
  /** Valgfri id for environment; sendes som ?env= på alle kall. */
  envId?: string | null;
  /** Timeout i ms per kall (default 20s). */
  timeoutMs?: number;
}

export class DockhandClient {
  private baseUrl: string;
  private token: string;
  private envId: string | null;
  private timeoutMs: number;

  constructor(opts: DockhandClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.token = opts.token.trim();
    this.envId = opts.envId ?? null;
    this.timeoutMs = opts.timeoutMs ?? 20000;
  }

  withEnv(envId: string | null): DockhandClient {
    const c = new DockhandClient({
      baseUrl: this.baseUrl,
      token: this.token,
      envId,
      timeoutMs: this.timeoutMs,
    });
    return c;
  }

  /** Rå fetch mot API-et med bearer-token, JSON-håndtering og timeout. */
  async request<T>(
    path: string,
    init: RequestInit & {
      query?: Record<string, string | number | null | undefined>;
      timeoutMs?: number;
    } = {},
  ): Promise<T> {
    const { query, timeoutMs, ...rest } = init;
    const url = new URL(this.baseUrl + path);
    if (this.envId) url.searchParams.set('env', this.envId);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? this.timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        ...rest,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
          ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
          ...(rest.headers ?? {}),
        },
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;

      if (!res.ok) {
        const lang = getCurrentLang();
        const msg =
          pickMessage(data) ??
          (res.status === 401
            ? translate(lang, 'err_unauthorized')
            : res.status === 403
              ? translate(lang, 'err_forbidden')
              : translate(lang, 'err_request_failed', { status: res.status }));
        throw new ApiError(res.status, msg);
      }
      return data as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new ApiError(0, translate(getCurrentLang(), 'err_timeout'));
      }
      const raw = e instanceof Error ? e.message : String(e);
      if (/network|fetch|failed/i.test(raw)) {
        throw new ApiError(0, translate(getCurrentLang(), 'err_network'));
      }
      throw new ApiError(0, raw);
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------- miljøer

  async getEnvironments(): Promise<DockhandEnvironment[]> {
    const data = await this.request<unknown>('/api/environments');
    const list = toArray<any>(data, ['environments', 'data', 'items']);
    return list
      .map((e) => ({
        id: String(e?.id ?? e?.Id ?? e?.ID ?? ''),
        name: String(e?.name ?? e?.Name ?? `Miljø ${e?.id ?? ''}`),
      }))
      .filter((e) => e.id.length > 0);
  }

  // ------------------------------------------------------------- containere

  async getContainers(): Promise<Container[]> {
    const data = await this.request<unknown>('/api/containers');
    return normalizeContainers(data);
  }

  /** Cachet resultat av siste oppdateringssjekk (trigger ingen sjekk). */
  async getPendingUpdates(): Promise<Container[]> {
    try {
      const data = await this.request<unknown>('/api/containers/pending-updates');
      return normalizePendingUpdates(data);
    } catch (e) {
      // Eldre versjoner kan mangle pending-updates – fall tilbake til check-updates
      if (e instanceof ApiError && e.status !== 0 && e.status !== 404 && e.status !== 405) throw e;
      const data = await this.request<unknown>('/api/containers/check-updates');
      return normalizePendingUpdates(data);
    }
  }

  /** Compose-stacks for gjeldende miljø. */
  async getStacks(): Promise<ComposeStack[]> {
    const data = await this.request<unknown>('/api/stacks');
    return normalizeStacks(data);
  }

  /** Redeployer en stack (pull + recreate). */
  async deployStack(name: string, opts?: { pull?: boolean; build?: boolean; forceRecreate?: boolean }): Promise<void> {
    const res = await this.request<{ success?: boolean; error?: string }>(
      `/api/stacks/${encodeURIComponent(name)}/deploy`,
      {
        method: 'POST',
        body: JSON.stringify({
          pull: opts?.pull ?? true,
          build: opts?.build ?? false,
          forceRecreate: opts?.forceRecreate ?? false,
        }),
        timeoutMs: 300000,
      },
    );
    if (res && res.success === false) {
      throw new ApiError(0, res.error || translate(getCurrentLang(), 'err_deploy_failed'));
    }
  }

  /** Omstarter en stack. */
  async restartStack(name: string, mode: 'restart' | 'ordered' | 'recreate' = 'restart'): Promise<void> {
    const res = await this.request<{ success?: boolean; error?: string }>(
      `/api/stacks/${encodeURIComponent(name)}/restart`,
      {
        method: 'POST',
        query: { mode },
        timeoutMs: 300000,
      },
    );
    if (res && res.success === false) {
      throw new ApiError(0, res.error || translate(getCurrentLang(), 'err_restart_failed'));
    }
  }

  /** Oppretter (og valgfritt deployer) en ny Compose-stack. */
  async createStack(
    name: string,
    compose: string,
    start: boolean,
    envVars?: { key: string; value: string; isSecret?: boolean }[],
  ): Promise<void> {
    const res = await this.request<{ success?: boolean; error?: string }>(
      '/api/stacks',
      {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          compose,
          start,
          envVars: envVars ?? [],
        }),
        timeoutMs: 300000,
      },
    );
    if (res && res.success === false) {
      throw new ApiError(0, res.error || translate(getCurrentLang(), 'err_request_failed', { status: 0 }));
    }
  }

  /** Trigger en sjekk for tilgjengelige oppdateringer (kjører som jobb). */
  async triggerUpdateCheck(): Promise<void> {
    await this.request<unknown>('/api/containers/check-updates', {
      method: 'POST',
      timeoutMs: 300000,
    });
  }

  async startContainer(id: string): Promise<void> {
    await this.action(id, 'start');
  }

  async stopContainer(id: string): Promise<void> {
    await this.action(id, 'stop');
  }

  async restartContainer(id: string): Promise<void> {
    await this.action(id, 'restart');
  }

  private async action(id: string, action: string): Promise<void> {
    await this.request<unknown>(`/api/containers/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      body: '{}',
      timeoutMs: 120000, // stop kan ta tid (grace period)
    });
  }

  /**
   * Oppdaterer én eller flere containere (pull ny image + recreate).
   * Bruker batch-endepunktet, som er dokumentert med body {"containerIds": [...]}.
   */
  async updateContainers(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.request<unknown>('/api/containers/batch-update', {
      method: 'POST',
      body: JSON.stringify({ containerIds: ids }),
      timeoutMs: 600000, // pull kan ta lang tid
    });
  }

  /** Full inspect-data for en container. */
  async getContainerInspect(id: string): Promise<ContainerInspect> {
    try {
      const data = await this.request<unknown>(`/api/containers/${encodeURIComponent(id)}/inspect`);
      return (data && typeof data === 'object' ? (data as ContainerInspect) : {}) as ContainerInspect;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 404)) return {};
      throw e;
    }
  }

  /** Logger (siste N linjer). */
  async getLogs(id: string, tail = 300): Promise<LogLine[]> {
    const data = await this.request<unknown>(
      `/api/containers/${encodeURIComponent(id)}/logs`,
      { query: { tail } },
    );
    return normalizeLogs(data);
  }
}

// ------------------------------------------------------------- normalisering

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function pickMessage(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) return data.slice(0, 300);
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    for (const k of ['message', 'error', 'detail', 'title']) {
      if (typeof o[k] === 'string' && (o[k] as string).trim()) return (o[k] as string).slice(0, 300);
    }
  }
  return null;
}

/** Henter liste fra enten array-respons eller {key: [...]}-respons. */
export function toArray<T>(data: unknown, keys: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    for (const k of keys) {
      const v = (data as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as T[];
    }
    // Fallback: første array-verdi i objektet
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

const CONTAINER_LIST_KEYS = ['containers', 'data', 'items', 'results'];

export function normalizeContainers(data: unknown): Container[] {
  return toArray<any>(data, CONTAINER_LIST_KEYS)
    .map(normalizeContainer)
    .filter((c): c is Container => c !== null);
}

const PENDING_UPDATE_LIST_KEYS = ['pendingUpdates', 'updates', 'pending', 'containers', 'items', 'data'];

/**
 * Normaliserer svaret fra pending-updates/check-updates, men tar bare med
 * containere som faktisk har en reell image-oppdatering (hasImageUpdate).
 * Eldre servere som ikke sender hasImageUpdate beholder alle radene (bakoverkompatibelt).
 */
export function normalizePendingUpdates(data: unknown): Container[] {
  const rows = toArray<any>(data, PENDING_UPDATE_LIST_KEYS);
  const hasExplicit = rows.some(
    (r) => r && typeof r === 'object' && typeof (r as Record<string, unknown>).hasImageUpdate === 'boolean',
  );
  const filtered = hasExplicit
    ? rows.filter((r) => !r || typeof r !== 'object' || (r as Record<string, unknown>).hasImageUpdate !== false)
    : rows;
  return normalizeContainers(filtered);
}

const STACK_LIST_KEYS = ['stacks', 'data', 'items', 'results'];

export function normalizeStacks(data: unknown): ComposeStack[] {
  return toArray<any>(data, STACK_LIST_KEYS)
    .map(normalizeStack)
    .filter((s): s is ComposeStack => s !== null);
}

function normalizeStack(raw: unknown): ComposeStack | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const name = firstString(o, 'name', 'Name', 'stackName', 'project');
  if (!name) return null;

  const rawDetails = Array.isArray(o['containerDetails'])
    ? o['containerDetails']
    : Array.isArray(o['containers']) && (o['containers'] as unknown[]).some((x) => x && typeof x === 'object')
      ? o['containers']
      : [];
  const containers = (rawDetails as unknown[])
    .map(normalizeStackContainer)
    .filter((c): c is StackContainer => c !== null);

  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;

  const containerCount =
    num(o['containerCount']) ??
    (Array.isArray(o['containers']) ? o['containers'].length : null) ??
    containers.length;

  const runningCount =
    num(o['runningCount']) ??
    containers.filter((c) => c.state === 'running').length;

  const updateCount =
    num(o['updateCount']) ??
    (o['updatesAvailable'] === true ? Math.max(1, containers.filter((c) => c.updateAvailable).length) : 0) ??
    containers.filter((c) => c.updateAvailable).length;

  const statusRaw = firstString(o, 'status', 'Status') || '';
  const healthRaw = firstString(o, 'health', 'Health') || '';
  const status = statusRaw
    ? statusRaw.toLowerCase()
    : containerCount <= 0
      ? 'stopped'
      : runningCount >= containerCount
        ? 'running'
        : runningCount > 0
          ? 'partial'
          : 'stopped';

  const health = healthRaw ? healthRaw.toLowerCase() : 'none';
  const sourceType = firstString(o, 'sourceType', 'SourceType') || null;

  return {
    name,
    status,
    health,
    sourceType,
    containerCount,
    runningCount,
    updateCount,
    containers,
  };
}

function normalizeStackContainer(raw: unknown): StackContainer | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const id = str(o['id'] ?? o['Id'] ?? o['ID'] ?? o['containerId']);
  const name = firstString(o, 'name', 'Name') || (id || '');
  if (!id && !name) return null;

  const stateObj = o['State'] as Record<string, unknown> | undefined;
  const state = str(o['state'] ?? stateObj?.['Status'] ?? 'unknown').toLowerCase();

  return {
    id: id || name,
    name: name || id,
    service: firstString(o, 'service', 'Service') || (name || id),
    state,
    image: firstString(o, 'image', 'Image') || translate(getCurrentLang(), 'image_unknown'),
    updateAvailable:
      o['updateAvailable'] === true ||
      o['hasUpdate'] === true ||
      o['hasImageUpdate'] === true,
  };
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
}

function firstString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  // Nøstede varianter: Config.Image (Docker-inspect-stil)
  const cfg = obj['Config'] as Record<string, unknown> | undefined;
  if (cfg) {
    for (const k of keys) {
      const v = cfg[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return '';
}

const UPDATE_FLAG_KEYS = [
  'updateAvailable',
  'hasUpdate',
  'hasImageUpdate',
  'imageUpdate',
  'needsUpdate',
  'updatePending',
];

/** Har objektet et eksplisitt "oppdatering tilgjengelig"-flagg? */
function hasUpdateFlag(o: Record<string, unknown>): boolean {
  for (const k of UPDATE_FLAG_KEYS) {
    if (o[k] === true) return true;
  }
  if (typeof o['newDigest'] === 'string' && o['newDigest'].length > 0) return true;
  if (typeof o['newImageId'] === 'string' && o['newImageId'].length > 0) return true;
  if (typeof o['newerVersion'] === 'string' && o['newerVersion'].length > 0) return true;
  if (typeof o['latestVersion'] === 'string' && o['latestVersion'].length > 0) return true;
  return false;
}

function idOf(o: Record<string, unknown>): string {
  return str(o['containerId'] ?? o['id'] ?? o['Id']);
}

/**
 * Samler id-er for containere med ventende oppdatering.
 * Støtter tre svarformer:
 *  - liste med containere (alle elementer har pending update → alle teller)
 *  - liste med containere der noen bærer et flagg (bare flaggede teller)
 *  - objekt/Map-der nøkkelen er container-id
 */
export function extractUpdateIds(data: unknown): Set<string> {
  // 1. Liste (eventuelt pakket i {updates|pendingUpdates|containers|...})
  const list = toArray<any>(data, ['updates', 'pendingUpdates', 'pending', 'containers', 'items', 'data']);
  if (list.length > 0) {
    const anyFlag = list.some((it) => it && typeof it === 'object' && hasUpdateFlag(it as Record<string, unknown>));
    const ids = new Set<string>();
    for (const it of list) {
      if (!it || typeof it !== 'object') continue;
      const o = it as Record<string, unknown>;
      const id = idOf(o) || str(o['name']);
      if (id && (anyFlag ? hasUpdateFlag(o) : true)) ids.add(id);
    }
    return ids;
  }

  // 2. Map-form: nøkkel = container-id
  const ids = new Set<string>();
  const visit = (node: unknown, depth: number, fallbackId: string) => {
    if (depth > 6 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, depth + 1, fallbackId));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const id = idOf(o) || fallbackId;
    if (id && hasUpdateFlag(o)) {
      ids.add(id);
      return;
    }
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') visit(v, depth + 1, id || k);
    }
  };
  visit(data, 0, '');
  return ids;
}

function normalizeContainer(raw: unknown): Container | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const id = str(o['id'] ?? o['Id'] ?? o['ID'] ?? o['containerId']);
  let name = firstString(o, 'name', 'Name');
  if (name.startsWith('/')) name = name.slice(1);
  if (!name && Array.isArray(o['Names'])) name = str(o['Names'][0]).replace(/^\//, '');

  const image = firstString(o, 'image', 'Image');
  const stateObj = o['State'] as Record<string, unknown> | undefined;
  const state = str(o['state'] ?? stateObj?.['Status'] ?? 'unknown') || 'unknown';
  const statusText = str(o['status'] ?? o['Status'] ?? o['statusText'] ?? '');

  const updateAvailable =
    o['updateAvailable'] === true ||
    o['hasUpdate'] === true ||
    o['hasImageUpdate'] === true ||
    o['imageUpdate'] === true ||
    o['needsUpdate'] === true ||
    o['updatePending'] === true ||
    (typeof o['newDigest'] === 'string' && o['newDigest'].length > 0) ||
    (typeof o['newImageId'] === 'string' && o['newImageId'].length > 0);

  if (!id && !name) return null;
  return {
    id: id || name,
    name: name || id,
    image: image || translate(getCurrentLang(), 'image_unknown'),
    state: state.toLowerCase(),
    statusText,
    updateAvailable,
  };
}

const ANSI_RE =
  /[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><~]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

export function normalizeLogs(data: unknown): LogLine[] {
  let text: string;
  if (typeof data === 'string') {
    text = data;
  } else if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const candidate = o['logs'] ?? o['data'] ?? o['output'] ?? o['text'] ?? o['content'];
    text = typeof candidate === 'string' ? candidate : JSON.stringify(candidate ?? o, null, 2);
  } else {
    text = '';
  }
  const lines = stripAnsi(text).split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map((l, i) => ({ id: String(i), text: l }));
}
