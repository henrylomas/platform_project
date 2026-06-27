import type { ObservabilityProvider, LogEntry } from '../types';

export class ConsoleProvider implements ObservabilityProvider {
  log(entry: LogEntry): void {
    const line = JSON.stringify(entry);
    if (entry.level === 'info' || entry.level === 'debug') {
      console.log(line);
    } else {
      console.error(line);
    }
  }
}
