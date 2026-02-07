# UI Backlog (Execution-Ready)

This backlog is for visual/product UI implementation on top of the existing functional frontend.

## Context

- Current UI is functional but intentionally basic.
- Backend/API contracts already exist and are typed.
- Goal: ship a polished, production-grade UI without changing core backend behavior.

## Definition of Done (UI Work)

- No `any` usage in handwritten TypeScript.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:smoke`, and `pnpm coverage` pass.
- Frontend coverage stays `>= 90%` line and branch.
- Mobile and desktop layouts are verified.
- Empty/loading/error/success states are present for each primary surface.

## Priority Order

1. `UI-001` Design foundation and tokens
2. `UI-002` App shell and navigation system
3. `UI-003` Kanban visual redesign
4. `UI-004` Task detail and editing experience
5. `UI-005` Chat UX redesign
6. `UI-006` Memory UX redesign
7. `UI-007` Cross-feature state UX (loading/empty/error/success)
8. `UI-008` Accessibility and keyboard support
9. `UI-009` Responsive/mobile hardening
10. `UI-010` Visual QA and regression protection

## Tasks

### `UI-001` Design Foundation and Tokens

Scope:
- Define CSS variables for spacing, radius, elevation, typography, semantic colors, and motion timing.
- Replace ad-hoc utility combinations with shared component styles where appropriate.

Acceptance Criteria:
- Global design tokens exist and are consumed by all four feature panels.
- Typography scale and spacing are consistent across pages.

Files:
- `apps/elara-nexus/frontend/src/styles.css`
- `apps/elara-nexus/frontend/src/components/*` (new shared primitives allowed)

### `UI-002` App Shell and Navigation System

Scope:
- Upgrade top-level shell to include clear page hierarchy, navigation landmarks, and better layout rhythm.
- Keep single-page route for now, but structure shell for future route growth.

Acceptance Criteria:
- Header, content container, and section layout feel cohesive on desktop and mobile.
- Visual hierarchy makes feature boundaries obvious.

Files:
- `apps/elara-nexus/frontend/src/routes/__root.tsx`
- `apps/elara-nexus/frontend/src/components/Header.tsx`
- `apps/elara-nexus/frontend/src/routes/index.tsx`

### `UI-003` Kanban Visual Redesign

Scope:
- Redesign Kanban cards/columns for readability, status clarity, and priority visibility.
- Improve affordances for move actions and task creation.

Acceptance Criteria:
- Columns/cards are visually distinct with clear status labeling.
- Task metadata is scannable (title, description, priority, state).
- Existing task create/move flows remain functional.

Files:
- `apps/elara-nexus/frontend/src/features/kanban/KanbanBoard.tsx`
- `apps/elara-nexus/frontend/src/features/kanban/KanbanBoard.unit.test.tsx`

### `UI-004` Task Detail and Editing Experience

Scope:
- Add task detail interaction (drawer or modal) for expanded editing context.
- Support editing title/description/priority/status within this surface.

Acceptance Criteria:
- User can open task details from card.
- Updates reflect in board state and keep API type contracts.
- Error and save feedback are visible.

Files:
- `apps/elara-nexus/frontend/src/features/kanban/*`

### `UI-005` Chat UX Redesign

Scope:
- Convert plain list into chat transcript UI with role-based message treatment.
- Add message composer improvements and send feedback states.

Acceptance Criteria:
- User/assistant messages are visually distinct.
- Loading/sending/error states are clear and non-blocking.
- Existing send/list behavior remains intact.

Files:
- `apps/elara-nexus/frontend/src/features/chat/ChatPanel.tsx`
- `apps/elara-nexus/frontend/src/features/chat/ChatPanel.unit.test.tsx`

### `UI-006` Memory UX Redesign

Scope:
- Improve ingest form ergonomics and search results presentation.
- Make relevance score and source easier to parse.

Acceptance Criteria:
- Ingest and search are clearly separated visually.
- Results are readable and support quick scanning.
- Error handling states are obvious.

Files:
- `apps/elara-nexus/frontend/src/features/memory/MemoryPanel.tsx`
- `apps/elara-nexus/frontend/src/features/memory/MemoryPanel.unit.test.tsx`

### `UI-007` Cross-Feature State UX

Scope:
- Standardize loading/empty/error/success presentation across settings, kanban, chat, and memory.

Acceptance Criteria:
- Shared pattern exists and is used consistently.
- No silent failure states remain.

Files:
- `apps/elara-nexus/frontend/src/features/*`
- `apps/elara-nexus/frontend/src/components/*` (new state primitives allowed)

### `UI-008` Accessibility and Keyboard Support

Scope:
- Add keyboard/focus support and ARIA semantics for forms, task move actions, and chat composer.

Acceptance Criteria:
- Focus order is logical.
- Interactive controls are keyboard-operable.
- Critical flows are usable with screen readers.

Files:
- `apps/elara-nexus/frontend/src/features/*`
- `apps/elara-nexus/frontend/src/components/*`

### `UI-009` Responsive/Mobile Hardening

Scope:
- Tune breakpoints and layout behavior for narrow screens and tablets.

Acceptance Criteria:
- No horizontal overflow at common mobile sizes.
- Panels remain usable without hidden critical controls.

Files:
- `apps/elara-nexus/frontend/src/routes/index.tsx`
- `apps/elara-nexus/frontend/src/features/*`
- `apps/elara-nexus/frontend/src/styles.css`

### `UI-010` Visual QA and Regression Protection

Scope:
- Add deterministic smoke-level UI assertions for key visual/structural states.
- Keep tests lightweight and stable (no external API dependency).

Acceptance Criteria:
- Tests cover shell render, feature section presence, and key interaction visuals.
- CI remains green with coverage thresholds intact.

Files:
- `apps/elara-nexus/frontend/src/routes/index.smoke.test.tsx`
- `apps/elara-nexus/frontend/src/features/**/*.unit.test.tsx`

