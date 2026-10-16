# Dockhand-mobil

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
- **Flere miljøer** – velg miljø i innstillinger hvis du har flere Docker-verter
- Token lagres kryptert på telefonen (Android Keystore via `expo-secure-store`)

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
    settings.tsx          # Innstillinger, miljøvalg, test tilkobling
  api/client.ts           # Dockhand-klient + normalisering av API-svar
  state/SettingsContext.tsx  # Tilkobling lagret sikkert med expo-secure-store
  components/             # Gjenbrukbare UI-komponenter
  __tests__/              # Tester for API-normaliseringen
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
npm test           # enhetstester for API-normalisering
npx expo-doctor    # sjekk av avhengigheter og konfigurasjon
npx expo export --platform android   # verifiser at appen bygger
```

## Sikkerhet

- Token sendes kun til serveren du selv har lagt inn – ingen tredjepart involvert
- Token lagres med `expo-secure-store` (Android Keystore)
- Anbefaling: kjør Dockhand på et privat nettverk eller bak VPN (Tailscale/
  WireGuard). En API-token gir full kontroll over Docker-verten din
- «Fjern tilkobling» i innstillinger sletter token og adresse fra telefonen
