import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApp, upgradeConvex } from './app.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(rootDir, '.env.local'), quiet: true });
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });
const { app, convexProxy } = createApp({ rootDir });
const port = process.env.PORT || 3000;
const server = app.listen(port, process.env.HOST || '127.0.0.1', () => {
  console.log(`Museum Rodenberg listening on port ${port}`);
});
server.on('upgrade', (req, socket, head) => upgradeConvex(convexProxy, req, socket, head));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
