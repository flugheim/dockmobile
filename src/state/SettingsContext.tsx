/**
 * Global tilstand: tilkoblingsinnstillinger (URL + token + valgt miljø)
 * og språkvalg, lagret sikkert på telefonen med expo-secure-store.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { getLocales } from 'expo-localization';
import { DockhandClient } from '../api/client';
import {
  resolveLang,
  translate,
  type AppLang,
  type LangChoice,
  type TransKey,
} from '../i18n/translations';
import type { ConnectionSettings, DockhandEnvironment } from '../types';

const KEY_URL = 'dockhand.baseUrl';
const KEY_TOKEN = 'dockhand.token';
const KEY_ENV_ID = 'dockhand.envId';
const KEY_ENV_NAME = 'dockhand.envName';
const KEY_LANG = 'dockhand.langChoice';

function deviceLanguageCode(): string {
  try {
    return getLocales()[0]?.languageCode ?? 'en';
  } catch {
    return 'en';
  }
}

interface SettingsValue {
  status: 'loading' | 'disconnected' | 'connected';
  settings: ConnectionSettings | null;
  environments: DockhandEnvironment[];
  /** Klient knyttet til gjeldende innstillinger (null hvis ikke tilkoblet). */
  client: DockhandClient | null;
  /** Validerer innstillingene mot serveren og lagrer ved suksess. */
  connect: (baseUrl: string, token: string, env?: DockhandEnvironment | null) => Promise<void>;
  selectEnvironment: (env: DockhandEnvironment) => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
  /** True mens miljølisten hentes fra serveren. */
  environmentsLoading: boolean;
  /** Hent miljølisten på nytt fra serveren. Returnerer listen (tom ved feil). */
  refreshEnvironments: () => Promise<DockhandEnvironment[]>;
  /** Brukerens språkvalg ('system' følger telefonen). */
  langChoice: LangChoice;
  /** Effektivt språk etter oppløsning mot telefonens språk. */
  lang: AppLang;
  setLangChoice: (choice: LangChoice) => Promise<void>;
  /** Oversett en nøkkel til gjeldende språk. */
  t: (key: TransKey, vars?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
  return url.replace(/\/+$/, '');
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ConnectionSettings | null>(null);
  const [environments, setEnvironments] = useState<DockhandEnvironment[]>([]);
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'connected'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [langChoice, setLangChoiceState] = useState<LangChoice>('system');

  const lang = useMemo(
    () => resolveLang(langChoice, deviceLanguageCode()),
    [langChoice],
  );

  const t = useCallback(
    (key: TransKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const persist = useCallback(async (s: ConnectionSettings) => {
    await SecureStore.setItemAsync(KEY_URL, s.baseUrl);
    await SecureStore.setItemAsync(KEY_TOKEN, s.token);
    if (s.envId) await SecureStore.setItemAsync(KEY_ENV_ID, s.envId);
    if (s.envName) await SecureStore.setItemAsync(KEY_ENV_NAME, s.envName);
  }, []);

  const [environmentsLoading, setEnvironmentsLoading] = useState(false);

  /**
   * Hent miljølisten på nytt fra serveren. Hvis det lagrede miljøet ikke
   * finnes lenger, falles det tilbake til det første miljøet slik at
   * appen ikke står igjen med et ugyldig valg.
   */
  const loadEnvironments = useCallback(
    async (baseUrl: string, token: string, currentEnvId: string | null): Promise<DockhandEnvironment[]> => {
      setEnvironmentsLoading(true);
      try {
        const probe = new DockhandClient({ baseUrl, token, timeoutMs: 15000 });
        const envs = await probe.getEnvironments();
        setEnvironments((prev) => {
          if (
            prev.length === envs.length &&
            prev.every((e, i) => e.id === envs[i]?.id && e.name === envs[i]?.name)
          ) {
            return prev;
          }
          return envs;
        });
        if (envs.length > 0 && currentEnvId && !envs.some((e) => e.id === currentEnvId)) {
          const fallback = envs[0];
          setSettings((prev) => {
            if (!prev) return prev;
            const next = { ...prev, envId: fallback.id, envName: fallback.name };
            void persist(next);
            return next;
          });
        }
        return envs;
      } catch {
        // Behold forrige liste ved nettfeil – bedre enn en tom liste.
        return [];
      } finally {
        setEnvironmentsLoading(false);
      }
    },
    [persist],
  );

  const refreshEnvironments = useCallback(async (): Promise<DockhandEnvironment[]> => {
    if (!settings) return [];
    return loadEnvironments(settings.baseUrl, settings.token, settings.envId);
  }, [settings, loadEnvironments]);

  // Les lagrede innstillinger ved oppstart
  useEffect(() => {
    (async () => {
      try {
        const [url, token, envId, envName, storedLang] = await Promise.all([
          SecureStore.getItemAsync(KEY_URL),
          SecureStore.getItemAsync(KEY_TOKEN),
          SecureStore.getItemAsync(KEY_ENV_ID),
          SecureStore.getItemAsync(KEY_ENV_NAME),
          SecureStore.getItemAsync(KEY_LANG),
        ]);
        if (storedLang === 'en' || storedLang === 'nb' || storedLang === 'system') {
          setLangChoiceState(storedLang);
        }
        if (url && token) {
          setSettings({
            baseUrl: url,
            token,
            envId: envId ?? null,
            envName: envName ?? null,
          });
          setStatus('connected');
          // Miljølisten er ikke lagret – hent den fersk fra serveren.
          void loadEnvironments(url, token, envId ?? null);
        } else {
          setStatus('disconnected');
        }
      } catch {
        setStatus('disconnected');
      }
    })();
  }, [loadEnvironments]);

  const connect = useCallback(
    async (rawUrl: string, token: string, env?: DockhandEnvironment | null) => {
      setError(null);
      const baseUrl = normalizeUrl(rawUrl);
      if (!token.trim()) {
        setError(t('connect_missingToken'));
        throw new Error('missing token');
      }
      const probe = new DockhandClient({ baseUrl, token, timeoutMs: 15000 });
      const envs = await probe.getEnvironments();
      if (envs.length === 0) {
        setError(t('connect_noEnvironments'));
        throw new Error('no environments');
      }
      const chosen = env ?? envs[0];
      const next: ConnectionSettings = {
        baseUrl,
        token: token.trim(),
        envId: chosen.id,
        envName: chosen.name,
      };
      await persist(next);
      setSettings(next);
      setEnvironments(envs);
      setStatus('connected');
    },
    [persist, t],
  );

  const selectEnvironment = useCallback(
    async (env: DockhandEnvironment) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = { ...prev, envId: env.id, envName: env.name };
        void persist(next);
        return next;
      });
      setEnvironments((prev) => (prev.some((e) => e.id === env.id) ? prev : [...prev, env]));
    },
    [persist],
  );

  const disconnect = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_URL),
      SecureStore.deleteItemAsync(KEY_TOKEN),
      SecureStore.deleteItemAsync(KEY_ENV_ID),
      SecureStore.deleteItemAsync(KEY_ENV_NAME),
    ]);
    setSettings(null);
    setEnvironments([]);
    setStatus('disconnected');
  }, []);

  const setLangChoice = useCallback(async (choice: LangChoice) => {
    await SecureStore.setItemAsync(KEY_LANG, choice);
    setLangChoiceState(choice);
  }, []);

  const client = useMemo(
    () => (settings ? new DockhandClient({
      baseUrl: settings.baseUrl,
      token: settings.token,
      envId: settings.envId,
    }) : null),
    [settings],
  );

  const value = useMemo<SettingsValue>(
    () => ({
      status,
      settings,
      environments,
      client,
      connect,
      selectEnvironment,
      disconnect,
      error,
      langChoice,
      lang,
      setLangChoice,
      t,
      environmentsLoading,
      refreshEnvironments,
    }),
    [
      status,
      settings,
      environments,
      client,
      connect,
      selectEnvironment,
      disconnect,
      error,
      langChoice,
      lang,
      setLangChoice,
      t,
      environmentsLoading,
      refreshEnvironments,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings må brukes inne i SettingsProvider');
  return ctx;
}
