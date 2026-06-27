import { describe, it, expect, vi, afterEach } from 'vitest';
import { DatadogProvider } from './datadog.provider';
import type { LogEntry } from '../types';

const ENTRY: LogEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  level: 'info',
  message: 'test',
  service: 'svc',
};

describe('DatadogProvider', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs with a [datadog] prefix', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    new DatadogProvider().log(ENTRY);
    expect(spy.mock.calls[0]?.[0] as string).toMatch(/^\[datadog\]/);
  });

  it('includes the serialised entry after the prefix', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    new DatadogProvider().log(ENTRY);
    const output = (spy.mock.calls[0]?.[0] as string).replace('[datadog] ', '');
    expect(() => JSON.parse(output)).not.toThrow();
    expect(JSON.parse(output)).toMatchObject({ message: 'test', service: 'svc' });
  });

  it('does not throw', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => new DatadogProvider().log(ENTRY)).not.toThrow();
  });
});
