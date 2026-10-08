import { Plugin, loadEnv } from 'vite';
import { createAdminApi } from '../server/admin-api.js';

export function devServerApiPlugin(): Plugin {
  return {
    name: 'dev-server-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '');
      server.middlewares.use('/api', createAdminApi(server.config.root, env));
    },
  };
}
