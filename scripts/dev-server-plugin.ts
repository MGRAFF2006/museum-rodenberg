import { type Plugin, loadEnv } from 'vite';
import { createApp, upgradeConvex } from '../server/app.js';

export function devServerApiPlugin(): Plugin {
  return {
    name: 'dev-server-api',
    configureServer(server) {
      const env = { ...process.env, ...loadEnv(server.config.mode, process.cwd(), '') };
      const { app, convexProxy } = createApp({ rootDir: process.cwd(), env, serveStatic: false });
      server.middlewares.use(app);
      const upgrade = (req: import('http').IncomingMessage, socket: import('stream').Duplex, head: Buffer) => {
        upgradeConvex(convexProxy, req, socket, head);
      };
      server.httpServer?.on('upgrade', upgrade);
      server.httpServer?.once('close', () => server.httpServer?.off('upgrade', upgrade));
    },
  };
}
