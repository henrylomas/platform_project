import type { LogLevel, LogEntry, ObservabilityProvider, ObservabilityClient } from './types';
import { redactEntry } from './redact';

class Client implements ObservabilityClient {
  constructor(
    private readonly provider: ObservabilityProvider,
    private readonly service: string,
  ) {}

  private emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...(context !== undefined && { context }),
    };
    this.provider.log(redactEntry(entry));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.emit('error', message, context);
  }
}

export function createObservability(
  provider: ObservabilityProvider,
  service: string,
): ObservabilityClient {
  return new Client(provider, service);
}
