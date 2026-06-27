import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { createObservability, ConsoleProvider } from '@platform/observability';
import { App } from './app/app';

const obs = createObservability(new ConsoleProvider(), 'web');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <App obs={obs} />
  </StrictMode>,
);
