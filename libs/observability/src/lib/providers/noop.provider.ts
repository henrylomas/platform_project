import type { ObservabilityProvider, LogEntry } from '../types';

export class NoopProvider implements ObservabilityProvider {
  log(_entry: LogEntry): void {}
}
