# Architecture

## App Boundaries

- Backend: `apps/elara-nexus/backend`
- Frontend: `apps/elara-nexus/frontend`

## Backend Layers

- `app/api/` HTTP boundary only
- `app/domain/` business enums and transition rules
- `app/services/` orchestration and validation
- `app/repositories/` persistence boundaries
- `app/infra/db/` SQLAlchemy models/sessions
- `app/infra/llm/` LiteLLM adapter
- `app/infra/telemetry/` Langfuse tracing hooks
- `app/core/` config, auth, middleware, rate limits

## Frontend Layers

- `src/features/kanban`
- `src/features/chat`
- `src/features/memory`
- `src/features/settings`
- `src/lib/api` typed API client
- `src/lib/state` persistent UI settings

## Persistence

- Engine mode supports SQLite and Postgres.
- Vector storage is backed by SQLite vector extension or pgvector.
- Service layer remains engine-agnostic via repository contracts.
