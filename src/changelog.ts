export const CHANGELOG = `1.5.6
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
