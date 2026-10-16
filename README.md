# Dockhand Mobil

An independent Android client for [Dockhand](https://dockhand.pro) – built to be
fast and simple for daily use, with one focus: **keeping your containers updated**.

> **Note:** This is a third-party project, not made by Finsys/Dockhand. The app
> talks to Dockhand's public REST API (documented at
> [dockhand.pro/manual](https://dockhand.pro/manual), section *API reference*) using
> a personal API token. It only uses the open, documented API – no Dockhand
> source code is used.

*Norsk versjon lenger ned.*

## What the app does

- **Container list** with live status (running / stopped / paused), image and uptime
- **Start / Stop / Restart** with confirmation on stop
- **One-tap update** – tap "Update" on a container to pull a new image
  and recreate it
- **"Update all"** – one button for every container with a pending update
- **Check for updates** – ask Dockhand about new images right now
- **Log viewer** with auto-refresh and pause
- **Multiple environments** – switch Docker hosts from the home screen
- Token stored encrypted on the phone (Android Keystore via `expo-secure-store`)
- **Language:** follows the phone's language (English/Norsk), overridable in settings

## Getting started

### 1. Create an API token in Dockhand

1. Open Dockhand in the browser → click your avatar (**Profile**)
2. Scroll to **API tokens** → **Generate token**
3. Give it a name, optional expiry → copy the token immediately (shown only once)
4. Tokens start with `dh_`

### 2. Install and run the app

```bash
cd dockhand-app
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on Android (free on Google Play).
All native modules the app uses are included in Expo Go, so no special build
is needed for testing.

> **Tunnel mode:** if the phone cannot reach the PC over the local network,
> run `npx expo start --tunnel`. On first use Expo asks to install ngrok
> globally (outside the project) – it is proprietary software that is
> deliberately *not* among the project's dependencies, keeping the repo
> F-Droid friendly.

### 3. Connect

1. Enter the Dockhand address, e.g. `http://192.168.1.10:3000`
2. Paste the token (`dh_...`)
3. Tap **Connect** – the app verifies the token and fetches your environments
4. On the same network as Dockhand? Then it works with no further setup

## Building a real Android app (APK/AAB)

No Android Studio or Java needed – the build runs in the cloud with EAS:

```bash
npm install -g eas-cli      # or use npx eas-cli@latest
eas login                   # free Expo account
eas build:configure         # links the project to your account
eas build --profile preview --platform android
```

The `preview` profile produces an **APK** you can install directly on your
phone. `production` produces an **AAB** for Google Play. The first build takes
5–15 minutes; you get a link to open on your phone to install.

Version numbers are managed locally in `app.json` (`version` +
`android.versionCode`) – bump `versionCode` by 1 for each release, for both
EAS and F-Droid.

## F-Droid

The repo is F-Droid ready: MIT license, no proprietary dependencies, no Google
services, no OTA updates, `android/` generated with `npx expo prebuild` and
committed, plus fastlane metadata under `fastlane/metadata/android/`.

### Building the APK locally (same as F-Droid does)

You need the Android SDK (e.g. via Android Studio):

```bash
npm ci
npx expo prebuild --platform android   # regenerate android/ after config changes
cd android
./gradlew assembleRelease
```

The APK ends up in `android/app/build/outputs/apk/release/`. Sign it with your
own keystore for distribution outside F-Droid.

### Submitting to F-Droid

1. Make the GitHub repo **public** (F-Droid only builds from public sources)
2. Verify the draft in `fdroid/no.flugheim.dockmobile.yml` against the
   [Build Metadata Reference](https://f-droid.org/docs/Build_Metadata_Reference/)
3. Submit it as a merge request to
   [fdroiddata](https://gitlab.com/fdroid/fdroiddata) as
   `metadata/no.flugheim.dockmobile.yml`

Note: F-Droid signs with its own key. If you already have the EAS build
(`v1.0.0` from GitHub releases) installed, it must be uninstalled before the
F-Droid version can be installed – same package name
(`no.flugheim.dockmobile`), different signature.

## Project structure

```
src/
  app/                    # Expo Router routes (one file = one screen)
    _layout.tsx           # Root navigation and providers
    index.tsx             # Container list (home screen)
    connect.tsx           # Connection screen
    container/[id].tsx    # Single container: details and actions
    logs/[id].tsx         # Log viewer
    settings.tsx          # Settings, language, environment switching
  api/client.ts           # Dockhand client + API response normalization
  i18n/translations.ts    # English/Norsk dictionaries (typed keys)
  state/SettingsContext.tsx  # Connection + language, stored with expo-secure-store
  components/             # Reusable UI components
  __tests__/              # Tests for API normalization and i18n
```

## The API the app uses

| Action | Endpoint |
|---|---|
| Environments | `GET /api/environments` |
| Container list | `GET /api/containers?env=<id>` |
| Pending updates | `GET /api/containers/pending-updates?env=<id>` |
| Check now | `POST /api/containers/check-updates?env=<id>` |
| Update containers | `POST /api/containers/batch-update?env=<id>` (`{containerIds: [...]}`) |
| Start / stop / restart | `POST /api/containers/<id>/{start,stop,restart}` |
| Logs | `GET /api/containers/<id>/logs?tail=400` |

All calls send `Authorization: Bearer dh_...`.

## Known limitations

- **Logs:** fetched by polling (±5 s), not real-time streaming
- **Self-signed certificates:** React Native cannot skip certificate checks.
  Use `http://` on the local network, or put Dockhand behind an https proxy
- **Compose stacks** and **statistics** are not in the first version
- Response shapes vary slightly between Dockhand versions; the client
  normalizes flexibly, but a highly unusual shape may need adjustment
  in `src/api/client.ts`

## Development

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npm test           # unit tests for API normalization and i18n
npx expo-doctor    # dependency and config check
npx expo export --platform android   # verify that the app builds
```

## Security

- The token is only sent to the server you entered – no third party involved
- The token is stored with `expo-secure-store` (Android Keystore)
- Recommendation: run Dockhand on a private network or behind a VPN
  (Tailscale/WireGuard). An API token gives full control over your Docker host
- "Remove connection" in settings deletes the token and address from the phone

---

# Dockhand-mobil (norsk)

En uavhengig Android-klient for [Dockhand](https://dockhand.pro) – laget for å være
rask og enkel i daglig bruk, med fokus på én ting: **å holde containerne oppdatert**.

> **Merk:** Dette er et tredjepartsprosjekt, ikke laget av Finsys/Dockhand. Appen
> snakker med Dockhands offentlige REST-API (dokumentert på
> [dockhand.pro/manual](https://dockhand.pro/manual), seksjon *API reference*) med en
> egen API-token. Den bruker kun det åpne, dokumenterte API-et – ingen kildekode fra
> Dockhand er brukt.

## Hva appen kan

- **Containerliste** med sanntidsstatus (kjører / stoppet / pauset), image og oppetid
- **Start / Stopp / Omstart** med bekreftelse på stopp
- **Én-trykks oppdatering** – trykk «Oppdater» på en container for å trekke ny image
  og gjenskape den
- **«Oppdater alle»** – én knapp for alle containerne som har oppdatering tilgjengelig
- **Sjekk oppdateringer** – spør Dockhand om nye images akkurat nå
- **Loggvisning** med auto-oppdatering og pause
- **Flere miljøer** – bytt Docker-vert direkte fra hjem-skjermen
- Token lagres kryptert på telefonen (Android Keystore via `expo-secure-store`)
- **Språk:** følger telefonens språk (norsk/engelsk), kan overstyres i innstillinger

## Kom i gang

### 1. Lag en API-token i Dockhand

1. Åpne Dockhand i nettleseren → klikk på avataren din (**Profile**)
2. Rull til **API tokens** → **Generate token**
3. Gi den et navn, valgfri utløpsdato → kopier token med en gang (vises bare én gang)
4. Token starter med `dh_`

### 2. Installer og kjør appen

```bash
cd dockhand-app
npm install
npx expo start
```

Skriv så QR-koden med **Expo Go**-appen på Android (gratis i Google Play).
Alle native moduler appen bruker er inkludert i Expo Go, så du trenger ingen
spesialbygning for å teste.

> **Tunnel-modus:** hvis telefonen ikke når PC-en over lokalnettet,
> kjør `npx expo start --tunnel`. Ved første gangs bruk spør Expo om å
> installere ngrok globalt (utenfor prosjektet) – det er proprietær
> programvare som bevisst *ikke* ligger i prosjektets avhengigheter,
> slik at repoet holder seg F-Droid-vennlig.

### 3. Koble til

1. Skriv inn adressen til Dockhand, f.eks. `http://192.168.1.10:3000`
2. Lim inn token (`dh_...`)
3. Trykk **Koble til** – appen verifiserer token og henter miljøene dine
4. Er du på nettverket der Dockhand kjører? Da fungerer det uten videre oppsett

## Bygge en ekte Android-app (APK/AAB)

Du trenger ikke Android Studio eller Java – bygget skjer i skyen med EAS:

```bash
npm install -g eas-cli      # eller bruk npx eas-cli@latest
eas login                   # gratis Expo-konto
eas build:configure         # oppretter kobling til prosjektet ditt
eas build --profile preview --platform android
```

`preview`-profilen lager en **APK** du kan installere direkte på telefonen.
`production` lager en **AAB** for Google Play. Første bygg tar 5–15 minutter; du
får en lenke du åpner på telefonen for å installere.

Versjonsnummer styres lokalt i `app.json` (`version` + `android.versionCode`) –
øk `versionCode` med 1 for hver nye utgave, både for EAS og F-Droid.

## F-Droid

Repoet er forberedt for F-Droid: MIT-lisens, ingen proprietære avhengigheter,
ingen Google-tjenester, ingen OTA-oppdateringer, `android/` generert med
`npx expo prebuild` og sjekket inn, samt fastlane-metadata under
`fastlane/metadata/android/`.

### Bygge APK-en lokalt (samme som F-Droid gjør)

Du trenger Android SDK (f.eks. via Android Studio):

```bash
npm ci
npx expo prebuild --platform android   # regenerer android/ etter config-endringer
cd android
./gradlew assembleRelease
```

APK-en havner i `android/app/build/outputs/apk/release/`. Signer den med din
egen keystore for distribusjon utenfor F-Droid.

### Sende inn til F-Droid

1. Gjør GitHub-repoet **offentlig** (F-Droid bygger kun fra offentlig kilde)
2. Verifiser utkastet i `fdroid/no.flugheim.dockmobile.yml` mot
   [Build Metadata Reference](https://f-droid.org/docs/Build_Metadata_Reference/)
3. Send det som merge request til
   [fdroiddata](https://gitlab.com/fdroid/fdroiddata) som
   `metadata/no.flugheim.dockmobile.yml`

Merk: F-Droid signerer med sin egen nøkkel. Har du EAS-bygget (`v1.0.0` fra
GitHub-releases) installert fra før, må det avinstalleres før F-Droid-versjonen
kan installeres – samme pakkenavn (`no.flugheim.dockmobile`), ulik signatur.

## Prosjektstruktur

```
src/
  app/                    # Expo Router-ruter (én fil = én skjerm)
    _layout.tsx           # Rotnavigasjon og providere
    index.tsx             # Containerliste (hjem-skjermen)
    connect.tsx           # Tilkoblingsskjerm
    container/[id].tsx    # Enkeltcontainer: detaljer og handlinger
    logs/[id].tsx         # Loggvisning
    settings.tsx          # Innstillinger, språk, miljøbytte
  api/client.ts           # Dockhand-klient + normalisering av API-svar
  i18n/translations.ts    # Engelsk/norsk-ordbøker (typede nøkler)
  state/SettingsContext.tsx  # Tilkobling + språk, lagret med expo-secure-store
  components/             # Gjenbrukbare UI-komponenter
  __tests__/              # Tester for API-normalisering og i18n
```

## API-et appen bruker

| Handling | Endepunkt |
|---|---|
| Miljøer | `GET /api/environments` |
| Containerliste | `GET /api/containers?env=<id>` |
| Ventende oppdateringer | `GET /api/containers/pending-updates?env=<id>` |
| Sjekk nå | `POST /api/containers/check-updates?env=<id>` |
| Oppdater containere | `POST /api/containers/batch-update?env=<id>` (`{containerIds: [...]}`) |
| Start / stopp / omstart | `POST /api/containers/<id>/{start,stop,restart}` |
| Logger | `GET /api/containers/<id>/logs?tail=400` |

Alle kall sender `Authorization: Bearer dh_...`.

## Kjente begrensninger

- **Logger:** loggene hentes med polling (±5 s), ikke sanntidsstrømming
- **Selvsignerte sertifikater:** React Native kan ikke hoppe over sertifikatsjekk.
  Bruk `http://` på lokalnettet, eller sett Dockhand bak en https-proxy
- **Compose-stacks** og **statistikk** er ikke med i første versjon
- Svarformene fra API-et varierer litt mellom Dockhand-versjoner; klienten
  normaliserer derfor fleksibelt, men en svært uvanlig form kan kreve justering
  i `src/api/client.ts`

## Utvikling

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npm test           # enhetstester for API-normalisering og i18n
npx expo-doctor    # sjekk av avhengigheter og konfigurasjon
npx expo export --platform android   # verifiser at appen bygger
```

## Sikkerhet

- Token sendes kun til serveren du selv har lagt inn – ingen tredjepart involvert
- Token lagres med `expo-secure-store` (Android Keystore)
- Anbefaling: kjør Dockhand på et privat nettverk eller bak VPN (Tailscale/
  WireGuard). En API-token gir full kontroll over Docker-verten din
- «Fjern tilkobling» i innstillinger sletter token og adresse fra telefonen
