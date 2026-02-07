# agent

Minimal monorepo scaffold for an agent platform.

## Structure

- `backend/` - Python backend managed with `uv`
- `frontend/` - TypeScript frontend using TanStack Start + Tailwind, managed with `pnpm`
- `goals/`, `tools/`, `args/`, `context/`, `hardprompts/` - GOTCHA framework layers
- `memory/`, `data/`, `.tmp/` - local memory, runtime data, and scratch space

## Quick start

Backend:

```bash
cd backend
uv run main.py
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```
