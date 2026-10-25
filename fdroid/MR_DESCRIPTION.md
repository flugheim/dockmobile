# F-Droid Merge Request (prepared, to be submitted later)

## Title
New app: DockMobile

## Abstract for new app inclusion

DockMobile is an independent Android client for [Dockhand](https://dockhand.pro), a
self-hosted Docker management tool. It lets you monitor environments, browse
containers and Compose stacks, view logs, and update containers (pull new images)
with one tap. It talks only to Dockhand's public REST API using a personal API
token; no Dockhand source code is used.

Unique features over other Docker clients:
- Multi-environment dashboard with global metrics (running/stopped/updates).
- One-tap and bulk "update all" container updates.
- Compose stack management (deploy/restart).
- Bilingual (English/Norwegian) with automatic system language detection.

Screenshots: see fastlane/metadata/android/{en-US,nb-NO}/images/.

## Checklist

### Policy
- [x] The app complies with the inclusion criteria.
- [x] Original app author (Kenneth Flugheim) is the submitter.
- [x] Upstream repo contains Fastlane metadata (fastlane/metadata/android/{en-US,nb-NO}/).

### Docs
- [x] Read CONTRIBUTING.md.
- [x] Metadata follows templates.
- [x] Read Build Metadata Reference.
- [x] Read Quick Start Guide.

### Merge Request Setup
- [x] Title follows "New app: DockMobile".
- [x] Fork is public, branch not protected.
- [ ] Rebasing done if conflicts.
- [ ] Related fdroiddata/rfp issues referenced (none yet).
- [x] Only one app in this MR.

### Metadata
- [x] Metadata in metadata/no.flugheim.dockmobile.yml.
- [x] Valid YAML, LF line endings.
- [x] No summary/description/changelog in metadata (provided upstream via Fastlane).
- [x] Releases tagged, auto update enabled (AutoUpdateMode: Version, UpdateCheckMode: Tags).
- [x] Issue tracker and contact info present.
- [x] AuthorName added.
- [x] Only latest version kept.
- [x] No disabled versions.
- [x] Full commit hash used.
- [ ] Reproducible builds (not yet enabled – APK signed with own key; reproducible build to be evaluated).
- [x] abi split (arm64-v8a only).

### Pipeline
- [ ] All pipelines pass (in progress).
- [ ] All warnings/errors in Reports fixed or explained.

Closes rfp# (none)

/label ~"New App"
