# Contributing

## Branch and PR Rules

- Open PRs against `main`.
- Squash merge only.
- No direct push to `main`.
- Resolve all PR conversations before merge.

## Required Checks

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

## CodeRabbit Policy

- Address all non-hallucinated findings.
- If a finding is hallucinated, document rationale in PR discussion before resolving.

## Typing Standard

- Do not use `any` to bypass type safety.
- Solve typing issues with proper models/interfaces and narrowing.
