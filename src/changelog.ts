export const CHANGELOG = `1.5.9
- Ikoner: alle knapper, kort og modaler bruker nå Nerd Font-glyfer (JetBrainsMono Nerd Font) i stedet for emoji/tekst.
- Tema: endret til Tokyo Night-fargepalett (bakgrunn #1a1b26, accent #7aa2f7, osv.) og JetBrainsMono Nerd Font som UI-font.
- Nye komponenter: `Icon` og `Text` for gjenbrukbare ikoner og typografi.

1.5.8
- Stack environment variables: expanded stack view now shows parsed env vars (secrets masked) and raw .env file.

1.5.7
- Server info modal is now scrollable on small screens.

1.5.6
- Server info: new info button (ℹ) on each environment card and on container/stack screens showing host IP, platform, CPU, memory, uptime, Docker version and system stats.

1.5.5
- Deploy options dialog: choose whether to pull latest images, build images, and force-recreate containers when deploying a stack.
- Delete containers and stacks with name-confirmation (type the name to confirm).
- Create new Compose stacks from the app, with environment variables (including secrets).

1.5.2
- Fixed connection failures in release builds (HTTP cleartext).
- All API error messages are now localized (English/Norwegian).

1.5.1
- Smaller Android APK (arm64 only, compressed bundle).
- (Status alert on open was added then removed.)

1.5.0
- Container details: ports, mounts, networks, health, restarts, limits, times.

1.4.0
- Deploy and Restart actions for Compose stacks.

1.3.0
- Pending-update detection fixed.
- Compose stacks view per environment.
- Dashboard loads all environments on open.
- Release APKs signed with dedicated key.

Full history: https://github.com/flugheim/dockmobile/releases
`;
