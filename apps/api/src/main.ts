import express from 'express';
import cors from 'cors';
import { createObservability, ConsoleProvider } from '@platform/observability';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const obs = createObservability(new ConsoleProvider(), 'api');

const app = express();

app.use(cors());

app.get('/health', (_req, res) => {
  obs.info('health check');
  res.json({ status: 'ok', service: 'api' });
});

app.listen(port, () => {
  obs.info('server started', { port });
});
