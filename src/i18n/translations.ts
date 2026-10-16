/**
 * Oversettelser for appen (engelsk + norsk).
 *
 * Bevisst uten i18n-rammeverk: to ordbøker, {variabel}-interpolering og
 * eksplisitte entall/flertall-nøkler. Alt typesjekkes via TransKey, og
 * __tests__/i18n.test.ts feiler hvis nb mangler en nøkkel fra en.
 *
 * Språkvalg: 'system' følger telefonens språk (norsk for nb/nn/no,
 * ellers engelsk), og kan overstyres i innstillinger.
 */

export type AppLang = 'en' | 'nb';
export type LangChoice = 'system' | AppLang;

const en = {
  // Tilkobling
  connect_subtitle: 'Connect to your own Dockhand server to manage and update containers.',
  connect_server: 'Server address',
  connect_token: 'API token',
  connect_tokenHint:
    'Create a token in Dockhand: Profile → API tokens → Generate token. The token is stored encrypted on your phone.',
  connect_button: 'Connect',
  connect_connecting: 'Connecting …',
  connect_missingToken: 'Paste an API token (starts with dh_).',
  connect_noEnvironments: 'Connected, but no environments to show.',
  connect_failedPrefix: 'Could not connect: ',

  // Navigasjon
  nav_containers: 'Containers',
  nav_container: 'Container',
  nav_logs: 'Logs',
  nav_settings: 'Settings',

  // Containerliste
  list_loading: 'Loading containers …',
  list_envFallback: 'Environment',
  list_updatedAt: 'Updated {time} · tap to switch',
  list_settings: 'Settings',
  list_check: 'Check',
  filter_all: 'All',
  filter_running: 'Running',
  filter_stopped: 'Stopped',
  filter_updates: 'Updates',
  banner_one: '1 container has an update available',
  banner_other: '{n} containers have updates available',
  updateAll: 'Update all',
  confirmUpdateAllTitle: 'Update all?',
  confirmUpdateAll_one: '1 container will pull a new image and be briefly down.',
  confirmUpdateAll_other: '{n} containers will pull new images and be briefly down.',
  updateStartedTitle: 'Update started',
  updateStarted_one:
    'The container is updating on the server. The list refreshes continuously.',
  updateStarted_other:
    '{n} containers are updating on the server. The list refreshes continuously.',
  updateFailed: 'Update failed',
  checkFailed: 'Check failed',
  actionFailed: 'Action failed',
  confirmStopTitle: 'Stop {name}?',
  confirmStopMessage: 'The container will be stopped now.',
  empty_updates: 'No updates',
  empty_updatesHint: 'Tap "Check" to look for new images now.',
  empty_containers: 'No containers',
  empty_containersHint: 'Pull down to reload the list.',

  // Felles
  common_cancel: 'Cancel',
  common_stop: 'Stop',
  common_retry: 'Try again',

  // Containerkort
  card_updateAvailable: '⬆ Update available',
  card_update: 'Update',
  card_start: 'Start',
  card_stop: 'Stop',
  card_restart: 'Restart',

  // Container-tilstander
  state_running: 'Running',
  state_exited: 'Stopped',
  state_paused: 'Paused',
  state_created: 'Created',
  state_restarting: 'Restarting',
  state_dead: 'Dead',
  state_removing: 'Removing',

  // Containerdetaljer
  detail_loading: 'Loading …',
  detail_notFound: 'Container not found.',
  detail_updateAvailable: '⬆ A new image is available',
  detail_updateNow: 'Update now',
  detail_image: 'Image',
  detail_id: 'ID',
  detail_status: 'Status',
  detail_viewLogs: 'View logs',

  // Logger
  logs_pause: 'Pause',
  logs_resume: 'Resume',
  logs_reload: 'Reload',
  logs_empty: 'No logs to show.',
  logs_fallbackName: 'Container',

  // Innstillinger
  settings_connection: 'Connection',
  settings_server: 'Server',
  settings_environment: 'Environment',
  settings_token: 'Token',
  settings_test: 'Test connection',
  settings_testOk: 'Connection OK',
  settings_testFailed: 'Connection failed',
  settings_connectedOne: 'Connected to {url} ({env}).',
  settings_connectedMany: 'Connected to {url} – {n} environments.',
  settings_switchEnv: 'Switch environment',
  settings_about: 'About the app',
  settings_about1:
    'Dockhand Mobil is an independent client for Dockhand. All communication goes directly from your phone to your own server – no data is sent to third parties.',
  settings_about2:
    'If you use a self-signed certificate, open the server once in the browser on your phone and accept it, or run Dockhand behind an https proxy.',
  settings_remove: 'Remove connection',
  settings_confirmRemoveTitle: 'Remove connection?',
  settings_confirmRemoveMessage: 'The token and address will be deleted from your phone.',
  settings_removeConfirm: 'Remove',
  settings_language: 'Language',
  settings_langSystem: 'System',
  settings_langNote: "Follows the phone's language. You can override it here.",
  env_empty: 'No environments found.',
} as const;

export type TransKey = keyof typeof en;

const nb: Record<TransKey, string> = {
  connect_subtitle: 'Koble til din egen Dockhand-server for å styre og oppdatere containere.',
  connect_server: 'Serveradresse',
  connect_token: 'API-token',
  connect_tokenHint:
    'Lag en token i Dockhand: Profile → API tokens → Generate token. Token lagres kryptert på telefonen.',
  connect_button: 'Koble til',
  connect_connecting: 'Kobler til …',
  connect_missingToken: 'Lim inn en API-token (starter med dh_).',
  connect_noEnvironments: 'Tilkoblet, men ingen miljøer å vise.',
  connect_failedPrefix: 'Kunne ikke koble til: ',

  nav_containers: 'Containere',
  nav_container: 'Container',
  nav_logs: 'Logger',
  nav_settings: 'Innstillinger',

  list_loading: 'Laster containere …',
  list_envFallback: 'Miljø',
  list_updatedAt: 'Oppdatert {time} · trykk for å bytte',
  list_settings: 'Innstillinger',
  list_check: 'Sjekk',
  filter_all: 'Alle',
  filter_running: 'Kjører',
  filter_stopped: 'Stoppet',
  filter_updates: 'Oppdatering',
  banner_one: '1 container har oppdatering tilgjengelig',
  banner_other: '{n} containere har oppdatering tilgjengelig',
  updateAll: 'Oppdater alle',
  confirmUpdateAllTitle: 'Oppdatere alle?',
  confirmUpdateAll_one: '1 container trekker ny image og går ned en kort stund.',
  confirmUpdateAll_other: '{n} containere trekker ny image og går ned en kort stund.',
  updateStartedTitle: 'Oppdatering startet',
  updateStarted_one: 'Containeren oppdateres på serveren. Listen oppdateres fortløpende.',
  updateStarted_other: '{n} containere oppdateres på serveren. Listen oppdateres fortløpende.',
  updateFailed: 'Oppdatering feilet',
  checkFailed: 'Sjekk feilet',
  actionFailed: 'Handling feilet',
  confirmStopTitle: 'Stoppe {name}?',
  confirmStopMessage: 'Containeren stoppes nå.',
  empty_updates: 'Ingen oppdateringer',
  empty_updatesHint: 'Trykk "Sjekk" for å lete etter nye images nå.',
  empty_containers: 'Ingen containere',
  empty_containersHint: 'Dra ned for å laste listen på nytt.',

  common_cancel: 'Avbryt',
  common_stop: 'Stopp',
  common_retry: 'Prøv igjen',

  card_updateAvailable: '⬆ Oppdatering tilgjengelig',
  card_update: 'Oppdater',
  card_start: 'Start',
  card_stop: 'Stopp',
  card_restart: 'Omstart',

  state_running: 'Kjører',
  state_exited: 'Stoppet',
  state_paused: 'Pauset',
  state_created: 'Opprettet',
  state_restarting: 'Starter om',
  state_dead: 'Død',
  state_removing: 'Fjernes',

  detail_loading: 'Laster …',
  detail_notFound: 'Containeren ble ikke funnet.',
  detail_updateAvailable: '⬆ En ny image er tilgjengelig',
  detail_updateNow: 'Oppdater nå',
  detail_image: 'Image',
  detail_id: 'ID',
  detail_status: 'Status',
  detail_viewLogs: 'Se logger',

  logs_pause: 'Pause',
  logs_resume: 'Fortsett',
  logs_reload: 'Last på nytt',
  logs_empty: 'Ingen logger å vise.',
  logs_fallbackName: 'Container',

  settings_connection: 'Tilkobling',
  settings_server: 'Server',
  settings_environment: 'Miljø',
  settings_token: 'Token',
  settings_test: 'Test tilkobling',
  settings_testOk: 'Tilkobling OK',
  settings_testFailed: 'Tilkobling feilet',
  settings_connectedOne: 'Tilkoblet {url} ({env}).',
  settings_connectedMany: 'Tilkoblet {url} – {n} miljøer.',
  settings_switchEnv: 'Bytt miljø',
  settings_about: 'Om appen',
  settings_about1:
    'Dockhand-mobil er en uavhengig klient for Dockhand. All kommunikasjon går direkte fra telefonen til din egen server – ingen data sendes til tredjepart.',
  settings_about2:
    'Bruker du et selvsignert sertifikat, åpne serveren én gang i nettleseren på telefonen og godta det, eller kjør Dockhand bak en https-proxy.',
  settings_remove: 'Fjern tilkobling',
  settings_confirmRemoveTitle: 'Fjerne tilkobling?',
  settings_confirmRemoveMessage: 'Token og adresse slettes fra telefonen.',
  settings_removeConfirm: 'Fjern',
  settings_language: 'Språk',
  settings_langSystem: 'System',
  settings_langNote: 'Følger telefonens språk. Du kan overstyre det her.',
  env_empty: 'Ingen miljøer funnet.',
};

export { en, nb };

export function translate(
  lang: AppLang,
  key: TransKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = (lang === 'nb' ? nb[key] : en[key]) ?? en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

/** 'system' + enhetens språkkode (f.eks. 'nb', 'en') → effektivt språk. */
export function resolveLang(choice: LangChoice, deviceLanguageCode: string): AppLang {
  if (choice !== 'system') return choice;
  const code = deviceLanguageCode.toLowerCase();
  if (code === 'nb' || code === 'nn' || code === 'no') return 'nb';
  return 'en';
}

const STATE_KEYS: Record<string, TransKey> = {
  running: 'state_running',
  exited: 'state_exited',
  paused: 'state_paused',
  created: 'state_created',
  restarting: 'state_restarting',
  dead: 'state_dead',
  removing: 'state_removing',
};

/** Norsk/engelsk tekst for container-tilstand, med rå tilstand som fallback. */
export function containerStateLabel(state: string, lang: AppLang): string {
  const key = STATE_KEYS[state.toLowerCase()];
  return key ? translate(lang, key) : state;
}
