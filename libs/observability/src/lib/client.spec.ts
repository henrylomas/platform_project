import { describe, it, expect } from 'vitest';
import { createObservability } from './client';
import type { LogEntry, ObservabilityProvider } from './types';

function captureProvider(): { entries: LogEntry[]; provider: ObservabilityProvider } {
  const entries: LogEntry[] = [];
  return { entries, provider: { log: (e) => entries.push(e) } };
}

describe('createObservability', () => {
  it('stamps timestamp and service automatically', () => {
    const { entries, provider } = captureProvider();
    const client = createObservability(provider, 'my-service');
    client.info('hello');
    expect(entries[0].service).toBe('my-service');
    expect(entries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it.each(['debug', 'info', 'warn', 'error'] as const)(
    'routes %s() to the provider with the correct level',
    (level) => {
      const { entries, provider } = captureProvider();
      const client = createObservability(provider, 'svc');
      client[level]('msg');
      expect(entries[0].level).toBe(level);
    },
  );

  it('passes context through to the provider', () => {
    const { entries, provider } = captureProvider();
    const client = createObservability(provider, 'svc');
    client.info('msg', { requestId: 'r1' });
    expect(entries[0].context).toEqual({ requestId: 'r1' });
  });

  it('omits context key entirely when none is supplied', () => {
    const { entries, provider } = captureProvider();
    const client = createObservability(provider, 'svc');
    client.info('msg');
    expect(entries[0]).not.toHaveProperty('context');
  });

  it('redacts sensitive context fields before the provider sees them', () => {
    const { entries, provider } = captureProvider();
    const client = createObservability(provider, 'svc');
    client.info('login', { password: 'hunter2', userId: '42' });
    expect(entries[0].context?.['password']).toBe('[REDACTED]');
    expect(entries[0].context?.['userId']).toBe('42');
  });

  it('routes to the swapped provider without changing the call site', () => {
    const cap1 = captureProvider();
    const cap2 = captureProvider();
    const client1 = createObservability(cap1.provider, 'svc');
    const client2 = createObservability(cap2.provider, 'svc');
    client1.info('hello');
    client2.info('hello');
    expect(cap1.entries).toHaveLength(1);
    expect(cap2.entries).toHaveLength(1);
    expect(cap1.entries[0].message).toBe('hello');
    expect(cap2.entries[0].message).toBe('hello');
  });
});
