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
  connect_httpWarning:
    'HTTP is unencrypted: the address, token and data are sent in plain text. Use HTTPS whenever possible.',

  // Navigasjon
  nav_environments: 'Environments',
  nav_containers: 'Containers',
  nav_container: 'Container',
  nav_logs: 'Logs',
  nav_settings: 'Settings',
  nav_stacks: 'Stacks',

  // Dashboard / Miljøoversikt
  overview_title: 'Dashboard',
  overview_loading: 'Loading environments …',
  overview_stoppedTotal: 'Stopped',
  overview_runningTotal: 'Running',
  overview_updatesTotal: 'Updates',
  overview_envCount_one: '1 environment',
  overview_envCount_other: '{n} environments',
  overview_envOnline: 'Online',
  overview_envOffline: 'Offline',
  overview_noContainers: '0 containers',
  overview_containerCount_one: '1 container',
  overview_containerCount_other: '{n} containers',
  overview_stoppedBadge: '{n} stopped',
  overview_runningBadge: '{n} running',
  overview_updatesBadge: '{n} updates',
  overview_allHealthy: 'All running normally',
  overview_errorFetching: 'Failed to fetch status',
  overview_tapToOpen: 'Tap to view containers',
  overview_active: 'Active',

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
  common_ok: 'OK',
  openAlert_title: 'Status on open',
  err_network:
    'Cannot reach the server. Check the address, that the phone is on the same network, and that Dockhand is running.',
  err_timeout: 'Timed out – could not reach the server.',
  err_unauthorized: 'Invalid or expired token.',
  err_forbidden: 'Token lacks access to this action.',
  err_request_failed: 'Request failed ({status}).',
  err_deploy_failed: 'Deploy failed.',
  err_restart_failed: 'Restart failed.',
  image_unknown: 'unknown image',
  openAlert_updates: '{n} containers have updates available',
  openAlert_stopped: '{n} containers are stopped',

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

  // Container-inspect
  detail_started: 'Started',
  detail_finished: 'Finished',
  detail_exitCode: 'Exit code',
  detail_restarts: 'Restarts',
  detail_restartPolicy: 'Restart policy',
  detail_memory: 'Memory limit',
  detail_cpu: 'CPU limit',
  detail_ports: 'Ports',
  detail_noPorts: 'No published ports',
  detail_mounts: 'Mounts',
  detail_noMounts: 'No mounts',
  detail_networks: 'Networks',
  detail_noNetworks: 'No networks',
  detail_health: 'Health',
  detail_created: 'Created',

  // Stacks
  stack_loading: 'Loading stacks …',
  stack_empty: 'No stacks',
  stack_emptyHint: 'No compose stacks were found in this environment.',
  stack_noContainers: 'No containers',
  stack_containers: '{running} of {total} running',
  stack_updates_one: '1 update',
  stack_updates_other: '{n} updates',
  stack_status_running: 'Running',
  stack_status_partial: 'Partial',
  stack_status_restarting: 'Restarting',
  stack_status_stopped: 'Stopped',
  stack_status_created: 'Not deployed',
  stack_health_healthy: 'Healthy',
  stack_health_unhealthy: 'Unhealthy',
  stack_health_starting: 'Starting',
  stack_source_internal: 'Managed',
  stack_source_external: 'External',
  stack_source_git: 'Git',
  stack_deploy: 'Deploy',
  stack_restart: 'Restart',
  stack_deployConfirmTitle: 'Deploy stack?',
  stack_deployConfirmMessage: 'The stack will pull the latest images and be recreated.',
  stack_restartConfirmTitle: 'Restart stack?',
  stack_restartConfirmMessage: 'All containers in the stack will be restarted.',
  stack_create: 'Create stack',
  stack_createTitle: 'New stack',
  stack_name: 'Name',
  stack_nameHint: 'Unique name for the stack',
  stack_compose: 'Compose (YAML)',
  stack_composeHint: 'Paste your docker-compose.yml content',
  stack_startNow: 'Start now',
  stack_createButton: 'Create',
  stack_created: 'Stack created',
  stack_createFailed: 'Failed to create stack',
  stack_envVars: 'Environment variables',
  stack_envKey: 'KEY',
  stack_envValue: 'value',
  stack_addEnvVar: 'Add variable',

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
  settings_version: 'Version',
  settings_changelog: 'Changelog',
  settings_changelogTitle: 'Changelog',
  settings_about1:
    'DockMobile is an independent client for Dockhand. All communication goes directly from your phone to your own server – no data is sent to third parties.',
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
  env_loading: 'Loading environments …',
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
  connect_httpWarning:
    'HTTP er ukryptert: adresse, token og data sendes i klartekst. Bruk HTTPS når det er mulig.',

  nav_environments: 'Miljøer',
  nav_containers: 'Containere',
  nav_container: 'Container',
  nav_logs: 'Logger',
  nav_settings: 'Innstillinger',
  nav_stacks: 'Stacker',

  overview_title: 'Oversikt',
  overview_loading: 'Laster miljøer …',
  overview_stoppedTotal: 'Stoppet',
  overview_runningTotal: 'Kjører',
  overview_updatesTotal: 'Oppdateringer',
  overview_envCount_one: '1 miljø',
  overview_envCount_other: '{n} miljøer',
  overview_envOnline: 'Tilkoblet',
  overview_envOffline: 'Frakoblet',
  overview_noContainers: '0 containere',
  overview_containerCount_one: '1 container',
  overview_containerCount_other: '{n} containere',
  overview_stoppedBadge: '{n} stoppet',
  overview_runningBadge: '{n} kjører',
  overview_updatesBadge: '{n} oppdateringer',
  overview_allHealthy: 'Alt kjører normalt',
  overview_errorFetching: 'Kunne ikke hente status',
  overview_tapToOpen: 'Trykk for å se containere',
  overview_active: 'Aktiv',

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
  common_ok: 'OK',
  openAlert_title: 'Status ved åpning',
  err_network:
    'Kan ikke nå serveren. Sjekk adresse, at telefonen er på samme nettverk, og at Dockhand kjører.',
  err_timeout: 'Tidsavbrudd – klarte ikke nå serveren.',
  err_unauthorized: 'Ugyldig eller utløpt token.',
  err_forbidden: 'Token mangler tilgang til denne handlingen.',
  err_request_failed: 'Forespørsel feilet ({status}).',
  err_deploy_failed: 'Deploy feilet.',
  err_restart_failed: 'Omstart feilet.',
  image_unknown: 'ukjent image',
  openAlert_updates: '{n} containere har oppdatering tilgjengelig',
  openAlert_stopped: '{n} containere er stoppet',

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

  // Container-inspect
  detail_started: 'Startet',
  detail_finished: 'Avsluttet',
  detail_exitCode: 'Exit-kode',
  detail_restarts: 'Omstarter',
  detail_restartPolicy: 'Omstartpolicy',
  detail_memory: 'Minnebegrensning',
  detail_cpu: 'CPU-begrensning',
  detail_ports: 'Porter',
  detail_noPorts: 'Ingen publiserte porter',
  detail_mounts: 'Monteringer',
  detail_noMounts: 'Ingen monteringer',
  detail_networks: 'Nettverk',
  detail_noNetworks: 'Ingen nettverk',
  detail_health: 'Helse',
  detail_created: 'Opprettet',

  // Stacks
  stack_loading: 'Laster stacker …',
  stack_empty: 'Ingen stacker',
  stack_emptyHint: 'Fant ingen compose-stacker i dette miljøet.',
  stack_noContainers: 'Ingen containere',
  stack_containers: '{running} av {total} kjører',
  stack_updates_one: '1 oppdatering',
  stack_updates_other: '{n} oppdateringer',
  stack_status_running: 'Kjører',
  stack_status_partial: 'Delvis',
  stack_status_restarting: 'Starter på nytt',
  stack_status_stopped: 'Stoppet',
  stack_status_created: 'Ikke deployet',
  stack_health_healthy: 'Frisk',
  stack_health_unhealthy: 'Ustabil',
  stack_health_starting: 'Starter',
  stack_source_internal: 'Administrert',
  stack_source_external: 'Ekstern',
  stack_source_git: 'Git',
  stack_deploy: 'Deploy',
  stack_restart: 'Omstart',
  stack_deployConfirmTitle: 'Deploye stack?',
  stack_deployConfirmMessage: 'Stacken trekker nyeste images og gjenskapes.',
  stack_restartConfirmTitle: 'Omstarte stack?',
  stack_restartConfirmMessage: 'Alle containere i stacken omstartes.',
  stack_create: 'Opprett stack',
  stack_createTitle: 'Ny stack',
  stack_name: 'Navn',
  stack_nameHint: 'Unikt navn for stacken',
  stack_compose: 'Compose (YAML)',
  stack_composeHint: 'Lim inn innholdet i docker-compose.yml',
  stack_startNow: 'Start nå',
  stack_createButton: 'Opprett',
  stack_created: 'Stack opprettet',
  stack_createFailed: 'Kunne ikke opprette stack',
  stack_envVars: 'Miljøvariabler',
  stack_envKey: 'NØKKEL',
  stack_envValue: 'verdi',
  stack_addEnvVar: 'Legg til variabel',

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
  settings_version: 'Versjon',
  settings_changelog: 'Endringslogg',
  settings_changelogTitle: 'Endringslogg',
  settings_about1:
    'DockMobile er en uavhengig klient for Dockhand. All kommunikasjon går direkte fra telefonen til din egen server – ingen data sendes til tredjepart.',
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
  env_loading: 'Laster miljøer …',
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

const STACK_STATUS_KEYS: Record<string, TransKey> = {
  running: 'stack_status_running',
  partial: 'stack_status_partial',
  restarting: 'stack_status_restarting',
  stopped: 'stack_status_stopped',
  created: 'stack_status_created',
};

const STACK_HEALTH_KEYS: Record<string, TransKey> = {
  healthy: 'stack_health_healthy',
  unhealthy: 'stack_health_unhealthy',
  starting: 'stack_health_starting',
};

const STACK_SOURCE_KEYS: Record<string, TransKey> = {
  internal: 'stack_source_internal',
  external: 'stack_source_external',
  git: 'stack_source_git',
};

/** Tekst for stack-status, med rå status som fallback. */
export function stackStatusLabel(status: string, lang: AppLang): string {
  const key = STACK_STATUS_KEYS[status.toLowerCase()];
  return key ? translate(lang, key) : status;
}

/** Tekst for stack-helse, med rå verdi som fallback. */
export function stackHealthLabel(health: string, lang: AppLang): string {
  const key = STACK_HEALTH_KEYS[health.toLowerCase()];
  return key ? translate(lang, key) : health;
}

/** Tekst for stack-kilde, med rå verdi som fallback. */
export function stackSourceLabel(sourceType: string | null, lang: AppLang): string {
  if (!sourceType) return '';
  const key = STACK_SOURCE_KEYS[sourceType.toLowerCase()];
  return key ? translate(lang, key) : sourceType;
}

// ------------------------------------------------------------- globalt språk
// Brukes av moduler utenfor React (f.eks. API-klienten) for å hente
// gjeldende språk uten prop-drilling.
let currentLang: AppLang = 'en';

export function setCurrentLang(lang: AppLang): void {
  currentLang = lang;
}

export function getCurrentLang(): AppLang {
  return currentLang;
}
