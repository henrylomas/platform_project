import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleProvider } from './console.provider';
import type { LogEntry } from '../types';

const BASE: LogEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  level: 'info',
  message: 'test message',
  service: 'test-svc',
};

describe('ConsoleProvider', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('formats info entries as valid JSON', () => {
    new ConsoleProvider().log(BASE);
    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('includes all LogEntry fields in JSON output', () => {
    const entry: LogEntry = { ...BASE, context: { requestId: 'r1' } };
    new ConsoleProvider().log(entry);
    const parsed = JSON.parse(stdoutSpy.mock.calls[0]?.[0] as string) as LogEntry;
    expect(parsed.timestamp).toBe(entry.timestamp);
    expect(parsed.level).toBe(entry.level);
    expect(parsed.message).toBe(entry.message);
    expect(parsed.service).toBe(entry.service);
    expect(parsed.context).toEqual({ requestId: 'r1' });
  });

  it('writes info to stdout, not stderr', () => {
    new ConsoleProvider().log({ ...BASE, level: 'info' });
    expect(stdoutSpy).toHaveBeenCalledOnce();
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('writes debug to stdout, not stderr', () => {
    new ConsoleProvider().log({ ...BASE, level: 'debug' });
    expect(stdoutSpy).toHaveBeenCalledOnce();
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('writes warn to stderr, not stdout', () => {
    new ConsoleProvider().log({ ...BASE, level: 'warn' });
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('writes error to stderr, not stdout', () => {
    new ConsoleProvider().log({ ...BASE, level: 'error' });
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
