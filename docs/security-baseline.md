# Security Baseline

## Auth

- Bearer token required on all non-health routes.
- Single-user auth model for current private deployment.

## HTTP Controls

- Strict CORS allowlist.
- Request timeout middleware.
- Request body size limit middleware.
- Per-IP and per-token rate limits.

## Data and Secrets

- No credentials committed to repository.
- Runtime secrets come from environment or secret manager.
- Structured audit logs for auth and privileged operations.

## Out of Scope for V1

- Public internet exposure hardening.
- Multi-user/OIDC auth.
