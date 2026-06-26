# Observability Usage Rules

## Importing

Always import `createObservability` from `@platform/observability`. Never import providers directly in feature code.

```ts
import { createObservability } from '@platform/observability';
```

## Initialization

Initialize once per app at startup (e.g. `main.ts`). Pass the resulting client instance down through the call stack — do not call `createObservability` more than once per process.

## Providers

- Production apps: `ConsoleProvider` (or `DatadogProvider` when wired up).
- Tests: `NoopProvider` always. This prevents log noise and ensures tests never depend on logging side-effects.
- Never instantiate providers directly in feature code.

## Log levels

| Level   | When to use                                      |
|---------|--------------------------------------------------|
| `debug` | Internal state, loop iterations, low-level flow  |
| `info`  | User-initiated actions, significant state changes|
| `warn`  | Recoverable errors, degraded-but-functional state|
| `error` | Failures that require attention or intervention  |
