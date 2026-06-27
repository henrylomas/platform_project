import type { LogEntry } from './types';

const SENSITIVE = new Set(['password', 'token', 'secret', 'authorization', 'key']);

export function redactContext(
  context: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
}

export function redactEntry(entry: LogEntry): LogEntry {
  if (entry.context === undefined) return entry;
  return { ...entry, context: redactContext(entry.context) };
}
