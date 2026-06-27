import type { ObservabilityProvider, LogEntry } from '../types';

export class DatadogProvider implements ObservabilityProvider {
  log(entry: LogEntry): void {
    // Stub only. A real integration would:
    // 1. npm install dd-trace
    // 2. Call require('dd-trace').init({ service, env, version }) at process startup.
    // 3. Replace this console.log with the tracer's structured logger, or ship
    //    entries to the local Datadog Agent via its HTTP intake or Unix socket.
    console.log(`[datadog] ${JSON.stringify(entry)}`);
  }
}
