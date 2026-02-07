# agent

Minimal monorepo scaffold for an agent platform.

## Structure

- `backend/` - Python backend managed with `uv`
- `frontend/` - TypeScript frontend using TanStack Start + Tailwind, managed with `pnpm`

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

