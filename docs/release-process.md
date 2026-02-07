# Release Process

## Versioning

- release-please, single version strategy.
- Baseline release context starts at `v0.0.1`.
- Major `v1.0.0` is manual and owner-triggered.

## Commit Conventions

Use conventional commits for automated semver:

- `feat:` -> minor
- `fix:` -> patch
- `feat!` or `BREAKING CHANGE:` -> major (manual policy still applies)

## Release Artifacts (V1)

- Source archives via GitHub Releases.
- Binary bundles for backend/frontend build outputs.
- Docker/GHCR is deferred.
