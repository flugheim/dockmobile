# DockMobile

An independent Android client for [Dockhand](https://dockhand.pro) – built to be
fast and simple for daily use, with one focus: **keeping your containers updated**.

> **Note:** This is a third-party project, not made by Finsys/Dockhand. The app
> talks to Dockhand's public REST API (documented at
> [dockhand.pro/manual](https://dockhand.pro/manual), section *API reference*) using
> a personal API token. It only uses the open, documented API – no Dockhand
> source code is used.

## Features

- **Environments Dashboard (Home)**:
  - Global metrics summary showing total running containers, stopped containers, and pending updates across all environments.
  - Dedicated environment cards displaying health status (online/offline), active environment badge, container counts, stopped count, and pending updates.
  - One-tap selection to switch active host and view its containers.
- **Container list**: Live status (running / stopped / paused), image name, and status text.
- **Start / Stop / Restart**: Immediate container lifecycle controls with safety confirmation on stop.
- **One-tap updates**: Tap "Update" on any container to pull the newest image and recreate it.
- **"Update all"**: One-button bulk update for every container with a pending image update.
- **Check for updates**: Query Dockhand on-demand to check Docker registries for new images.
- **Log viewer**: Auto-refreshing container logs with pause and reload controls.
- **Encrypted credentials**: API tokens are securely stored on your device (Android Keystore via `expo-secure-store`).
- **Bilingual**: Seamless English and Norwegian (Bokmål) localization with automatic system language detection or manual override in settings.

## Getting started

### 1. Create an API token in Dockhand

1. Open Dockhand in your browser → click your avatar (**Profile**).
2. Scroll to **API tokens** → **Generate token**.
3. Provide a name and optional expiry date → copy the token (starts with `dh_`).

### 2. Connect in the app

1. Launch DockMobile.
2. Enter your Dockhand server address, e.g. `http://192.168.1.10:3000`.
3. Paste the token (`dh_...`).
4. Tap **Connect** – the app verifies authentication and fetches all your environments.

## Download & Releases

- **GitHub Releases**: Download prebuilt `.apk` files directly from the [Releases](https://github.com/flugheim/dockmobile/releases) tab.
- **Automated CI/CD**: Every push to `master` and every version tag runs a full test suite and builds a release APK automatically via GitHub Actions.

## Building the APK

### Automated GitHub Actions (Recommended)
Pushing a release tag will automatically build and publish the APK to GitHub Releases:
```bash
git tag v1.2.0
git push origin v1.2.0
```

### Building Locally with Gradle
Prerequisites: JDK 17 and Android SDK configured (`ANDROID_HOME`).

```bash
npm ci
cd android
./gradlew assembleRelease
```
The output APK is generated at:
`android/app/build/outputs/apk/release/app-release.apk`

### Building with Expo Application Services (EAS)
```bash
npx eas-cli login
npx eas-cli build --profile preview --platform android
```

## Project Structure

```
src/
  app/                    # Expo Router screens
    _layout.tsx           # Root navigation stack and theme provider
    index.tsx             # Environments Dashboard (home screen)
    containers.tsx        # Container list for selected environment
    connect.tsx           # Server & token connection screen
    container/[id].tsx    # Container details and actions
    logs/[id].tsx         # Container log viewer
    settings.tsx          # Connection settings and language switcher
  api/
    client.ts             # REST client with resilient API normalization
  components/             # UI components (EnvironmentCard, ContainerCard, etc.)
  i18n/
    translations.ts       # Typed English and Norwegian translations
  state/
    SettingsContext.tsx   # SecureStore credentials and environment state
  __tests__/              # Unit tests for API client and translation parity
```

## The API Endpoints Used

| Action | Endpoint |
|---|---|
| Environments | `GET /api/environments` |
| Container list | `GET /api/containers?env=<id>` |
| Pending updates | `GET /api/containers/pending-updates?env=<id>` |
| Check now | `POST /api/containers/check-updates?env=<id>` |
| Update containers | `POST /api/containers/batch-update?env=<id>` (`{containerIds: [...]}`) |
| Start / stop / restart | `POST /api/containers/<id>/{start,stop,restart}` |
| Logs | `GET /api/containers/<id>/logs?tail=400` |

All requests include `Authorization: Bearer dh_...`.

## Development & Verification

```bash
npx tsc --noEmit    # TypeScript typechecking
npx expo lint       # ESLint verification
npm test            # Client normalization and i18n tests
```

## Security

- All communication is direct between your phone and your Dockhand server – no third parties or telemetry.
- API tokens are stored in the Android Keystore using `expo-secure-store`.
- Recommendation: Host Dockhand on a private LAN or connect via a VPN (e.g. Tailscale or WireGuard).
