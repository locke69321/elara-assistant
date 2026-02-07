# agent

Elara Nexus monorepo (GOTCHA-based).

## Structure

- `apps/elara-nexus/backend` - FastAPI backend managed with `uv`
- `apps/elara-nexus/frontend` - TanStack Start frontend managed with `pnpm`
- `goals/`, `tools/`, `args/`, `context/`, `hardprompts/` - GOTCHA layers
- `memory/`, `data/`, `.tmp/` - local memory/runtime scratch

## Quick Start

Backend:

```bash
cp .env.example .env
cd apps/elara-nexus/backend
uv sync --all-groups
uv run uvicorn app.main:app --reload
```

Frontend:

```bash
cd apps/elara-nexus/frontend
pnpm install
pnpm dev
```

## Test and Quality

Backend:

```bash
cd apps/elara-nexus/backend
uv run ruff check .
uv run mypy app
uv run pytest -m unit
uv run pytest -m integration
uv run pytest -m smoke
uv run pytest --cov=app --cov-branch --cov-report=term-missing --cov-fail-under=90
```

Frontend:

```bash
cd apps/elara-nexus/frontend
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:smoke
pnpm coverage
```

## Backlogs

- UI implementation backlog: `docs/ui-backlog.md`
