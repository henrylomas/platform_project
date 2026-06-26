# Observability Library Spec

## Purpose

A provider-agnostic observability library shared by all apps in this monorepo. The provider can be swapped without changing application code.

## Core types

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;                      // ISO 8601
  level: LogLevel;
  message: string;
  service: string;
  context?: Record<string, unknown>;
}

interface ObservabilityProvider {
  log(entry: LogEntry): void;
}
```

## Secret redaction

Before any provider receives a `LogEntry`, strip fields from `context` whose key (case-insensitive) matches any of:

```
password, token, secret, authorization, key
```

Replace the value with `'[REDACTED]'`. Redaction happens inside `ObservabilityClient` before the entry is handed to the provider — providers must never see raw secrets.

## Providers

### ConsoleProvider

- Formats the full `LogEntry` as JSON (single line).
- `info` and `debug` write to `stdout`.
- `warn` and `error` write to `stderr`.

### NoopProvider

- Discards all entries silently.
- Used in tests. Must not throw.

### DatadogProvider (stub)

- Logs the entry with a `[datadog]` prefix so the stub is visibly distinct.
- Include a comment explaining that a real integration would add the `dd-trace` SDK and forward entries to the Datadog agent.

## Factory

```ts
export function createObservability(
  provider: ObservabilityProvider,
  service: string,
): ObservabilityClient;
```

`ObservabilityClient` exposes four methods — one per log level:

```ts
interface ObservabilityClient {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
```

The client stamps `timestamp` (ISO 8601) and `service` automatically; callers never set those fields.

## Tests required

| Test | What it verifies |
|------|-----------------|
| ConsoleProvider formats JSON correctly | Output is valid JSON containing all `LogEntry` fields |
| NoopProvider discards without throwing | Calling all four log methods does not throw |
| DatadogProvider stub logs with `[datadog]` prefix | Output contains the prefix string |
| Redaction removes sensitive fields before logging | Keys matching the redaction list are replaced with `'[REDACTED]'` before the provider sees the entry |
| Provider can be swapped without changing client call site | Replacing the provider passed to `createObservability` changes behaviour without modifying any call to `client.info()` etc. |
