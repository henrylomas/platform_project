# TypeScript Coding Standards

## Strict mode

All code runs under `strict: true`. No exceptions. The root `tsconfig.base.json` sets this; individual project configs must not weaken it.

## Types

- No `any`. Use `unknown` and narrow with type guards.
- Explicit return types on all exported functions.
- Prefer named exports over default exports.

## File size

Files must not exceed 150 lines. Split by responsibility when approaching the limit — do not pad with blank lines to delay the split.

## Logging

No `console.log`, `console.warn`, or `console.error` in application code. All logging goes through the observability instance. See `.ai/rules/observability.md`.
