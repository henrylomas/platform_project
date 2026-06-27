import { describe, it, expect } from 'vitest';
import { redactContext, redactEntry } from './redact';
import type { LogEntry } from './types';

const BASE: LogEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  level: 'info',
  message: 'test',
  service: 'svc',
};

describe('redactContext', () => {
  it.each(['password', 'token', 'secret', 'authorization', 'key'])(
    'redacts "%s" (exact lowercase)',
    (field) => {
      expect(redactContext({ [field]: 'sensitive' })[field]).toBe('[REDACTED]');
    },
  );

  it.each(['PASSWORD', 'Token', 'SECRET', 'Authorization', 'KEY'])(
    'redacts "%s" (case-insensitive)',
    (field) => {
      expect(redactContext({ [field]: 'sensitive' })[field]).toBe('[REDACTED]');
    },
  );

  it('preserves non-sensitive fields', () => {
    const result = redactContext({ userId: '123', action: 'login' });
    expect(result).toEqual({ userId: '123', action: 'login' });
  });

  it('handles mixed sensitive and non-sensitive fields', () => {
    const result = redactContext({ password: 'hunter2', userId: '42' });
    expect(result['password']).toBe('[REDACTED]');
    expect(result['userId']).toBe('42');
  });
});

describe('redactEntry', () => {
  it('returns the same reference when context is absent', () => {
    expect(redactEntry(BASE)).toBe(BASE);
  });

  it('strips sensitive fields from context', () => {
    const entry: LogEntry = { ...BASE, context: { token: 'abc', userId: '1' } };
    const result = redactEntry(entry);
    expect(result.context?.['token']).toBe('[REDACTED]');
    expect(result.context?.['userId']).toBe('1');
  });

  it('does not mutate the original entry', () => {
    const ctx = { password: 'secret' };
    const entry: LogEntry = { ...BASE, context: ctx };
    redactEntry(entry);
    expect(ctx['password']).toBe('secret');
  });
});
