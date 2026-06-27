import * as React from 'react';
import type { ObservabilityClient } from '@platform/observability';

interface Props {
  obs: ObservabilityClient;
}

type HealthState =
  | { status: 'loading' }
  | { status: 'success'; service: string }
  | { status: 'error'; errorMessage: string };

const apiUrl =
  (import.meta.env['VITE_API_URL'] as string | undefined) ??
  'http://localhost:3000';

export function App({ obs }: Props): React.ReactElement {
  const [state, setState] = React.useState<HealthState>({ status: 'loading' });

  React.useEffect(() => {
    const check = async (): Promise<void> => {
      try {
        const res = await fetch(`${apiUrl}/health`);
        const data = (await res.json()) as { status: string; service: string };
        obs.info('health check success', { status: res.status });
        setState({ status: 'success', service: data.service });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        obs.error('health check failed', { error: message });
        setState({ status: 'error', errorMessage: message });
      }
    };
    void check();
  }, [obs]);

  if (state.status === 'loading') {
    return <p>Checking backend...</p>;
  }

  if (state.status === 'success') {
    return (
      <div>
        <p>Backend service is live</p>
        <p>{state.service}</p>
      </div>
    );
  }

  return (
    <div>
      <p>Backend service is unavailable</p>
      <p>{state.errorMessage}</p>
    </div>
  );
}
