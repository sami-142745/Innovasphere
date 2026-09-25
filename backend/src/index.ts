import 'dotenv/config';
import { createApp } from './server/app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[project-nexus-backend] listening on :${PORT}`);
});

