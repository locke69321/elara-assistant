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

## Release-Please Prerequisites

- Repository setting: enable **Allow GitHub Actions to create and approve pull requests**.
- Optional fallback: set `RELEASE_PLEASE_TOKEN` (classic PAT with `repo` scope) as a repository secret.
  - Workflow uses this token first, then falls back to `GITHUB_TOKEN`.

## Troubleshooting

- Symptom: release-please workflow fails with "GitHub Actions is not permitted to create or approve pull requests".
  - Fix: enable the repository setting above, or provide `RELEASE_PLEASE_TOKEN`.
