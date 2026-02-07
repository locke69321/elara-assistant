# Elara Nexus V1 Execution Goal

## Objective

Implement a security-first, TDD-first core agent platform under:

- `apps/elara-nexus/backend`
- `apps/elara-nexus/frontend`

V1 excludes external messaging channels and Docker/GHCR.

## Scope (In)

- FastAPI backend with clean architecture layers
- TanStack Start frontend with full Kanban UI
- Chat runtime core via LiteLLM only
- Memory subsystem with semantic retrieval
- Dual DB support day 1: SQLite + Postgres
- Dual vector support day 1: SQLite vector extension + pgvector
- Langfuse trace integration
- OSS governance + CI policy enforcement
- release-please semver + source/binary bundle release artifacts

## Scope (Out)

- Telegram/Discord/Slack adapters
- Docker and GHCR pipeline
- OIDC/multi-user auth

## Success Criteria

- Required CI checks pass
- Backend and frontend each meet coverage >= 90% line and branch
- Core Kanban/chat/memory flows pass smoke + integration + unit tests
- release-please works from `v0.0.1` baseline
- Branch protection works for solo-maintainer mode (no required human approval yet)

## Locked Decisions

- Auth: single-user bearer token + private tailnet assumption
- LLM path: LiteLLM-only (OpenAI-compatible API)
- Observability: Langfuse traces for runs/messages
- Versioning: single repo version, baseline `v0.0.1`, major only by explicit owner request
- Merge policy: squash-only, no force push, no direct push to `main`
- Solo phase: no required human approvals, all checks + resolved conversations required
- Releases: source + binary bundles, no container publishing in V1
- Type safety: no use of `any` to bypass typing; resolve with proper typed models/narrowing

## Architecture

### Backend

- `app/api/` HTTP handlers and DTOs
- `app/domain/` entities and value types
- `app/services/` business orchestration
- `app/repositories/` abstract persistence boundaries
- `app/infra/db/` SQLAlchemy sessions and migration baseline
- `app/infra/vector/` sqlite/pgvector adapters
- `app/infra/llm/` LiteLLM client adapter
- `app/infra/telemetry/` Langfuse hooks
- `app/core/` settings, auth, rate-limits, error model

### Frontend

- `src/features/kanban/`
- `src/features/chat/`
- `src/features/memory/`
- `src/features/settings/`
- `src/lib/api/` typed API client
- `src/routes/` route composition only

## Public API (V1)

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/me`
- `GET|POST|PATCH /api/v1/boards...`
- `GET|POST|PATCH /api/v1/tasks...`
- `POST /api/v1/tasks/{id}/move`
- `GET /api/v1/tasks/{id}/history`
- `POST /api/v1/chat/sessions`
- `POST /api/v1/chat/sessions/{id}/messages`
- `GET /api/v1/chat/sessions/{id}/messages`
- `POST /api/v1/memory/documents`
- `POST /api/v1/memory/search`
- `GET /api/v1/memory/documents/{id}`

## Public Types (V1)

- `TaskStatus`: `backlog | todo | in_progress | blocked | review | done`
- `TaskPriority`: `p0 | p1 | p2 | p3`
- `RunStatus`: `queued | running | succeeded | failed | canceled`
- `EngineMode`: `sqlite | postgres`
- `MemorySearchResult`: `{ chunk_id, document_id, score, snippet, source_ref }`

## Data Model

Logical tables:

- `users`
- `boards`, `columns`, `tasks`, `task_events`
- `chat_sessions`, `chat_messages`, `runs`
- `memory_documents`, `memory_chunks`, `embedding_entries`

Engine behavior:

- SQLite: relational + SQLite vector extension
- Postgres: relational + pgvector
- Repository parity tests required for both engines

## Security Controls

- Bearer auth on non-health endpoints
- Strict CORS allowlist
- Request body size limits
- Request/read timeout controls
- Per-IP and per-token rate limiting
- Structured audit logs for auth and privileged writes
- Secrets only via environment/secret store

## Testing Strategy (Mandatory)

Per feature: Red -> Green -> Refactor for smoke, integration, and unit layers.

### Smoke

- Health/ready/auth sanity
- Kanban create/edit/move
- Chat session create/send/read
- Memory ingest/search roundtrip

### Integration

- API + DB flows across SQLite and Postgres
- Vector retrieval parity across SQLite vector and pgvector
- LiteLLM integration with mocked remote responses
- Langfuse emission contract tests

### Unit

- Task transition constraints
- Service validation logic
- Memory chunking/scoring logic
- Auth/rate-limit behavior
- Error mapping/serialization

Coverage gates:

- Backend: line >= 90 and branch >= 90
- Frontend: line >= 90 and branch >= 90

## OSS Governance

Required checks:

- backend lint
- backend typecheck
- backend unit
- backend integration
- backend smoke
- backend coverage gate
- frontend lint
- frontend typecheck
- frontend unit
- frontend integration
- frontend smoke
- frontend coverage gate
- CodeRabbit status check

Branch protection (`main`):

- PR required
- No required human approvals (solo-maintainer mode)
- All checks required
- All conversations resolved
- Branch up-to-date required
- No direct pushes
- No force pushes
- Squash-only merge

CodeRabbit policy:

- Required status check
- Resolve all non-hallucinated findings before merge
- Hallucination triage must be documented in PR before resolving

## Release Policy

- release-please single-version strategy
- Start from `v0.0.1`
- Conventional commits for semver automation
- Publish source and binary bundles in GitHub Releases
- No Docker artifacts in V1
- `v1.0.0` only on explicit owner command

## Implementation Order

1. Move repo layout to `apps/elara-nexus/{backend,frontend}`
2. Bootstrap CI, branch policy, CodeRabbit checks, release-please
3. Backend core domain/repository and dual-engine baseline
4. Kanban API and frontend UI
5. Chat runtime + LiteLLM + Langfuse
6. Memory ingest/search + dual-vector behavior
7. Hardening pass: timeouts/rate limits/audit logging
8. Validate release process from `v0.0.1`

## Constraints

- Third-party services are mocked in tests
- No `any` shortcuts to bypass typing issues; solve typing correctly
- Do not modify existing goals without explicit owner approval
