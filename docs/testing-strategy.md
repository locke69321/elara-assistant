# Testing Strategy

## TDD Workflow

For every feature and bugfix:

1. Write failing smoke test.
2. Write failing integration tests.
3. Write failing unit tests.
4. Implement minimum solution.
5. Refactor with all tests green.

## Required Test Layers

- Smoke: core user flows and auth/health checks.
- Integration: API + persistence + adapter behavior.
- Unit: domain rules and service logic.

## Coverage Gates

- Backend: line >= 90, branch >= 90.
- Frontend: line >= 90, branch >= 90.

Coverage gates are enforced in CI and locally by dedicated scripts.
