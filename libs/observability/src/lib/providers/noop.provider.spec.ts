import { describe, it, expect } from 'vitest';
import { NoopProvider } from './noop.provider';
import type { LogEntry } from '../types';

const ENTRY: LogEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  level: 'info',
  message: 'hello',
  service: 'test',
};

describe('NoopProvider', () => {
  it.each(['debug', 'info', 'warn', 'error'] as const)(
    'does not throw for level "%s"',
    (level) => {
      expect(() => new NoopProvider().log({ ...ENTRY, level })).not.toThrow();
    },
  );

  it('does not throw when context is present', () => {
    expect(() =>
      new NoopProvider().log({ ...ENTRY, context: { key: 'value' } }),
    ).not.toThrow();
  });
});
