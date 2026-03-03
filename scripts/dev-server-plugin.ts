import { Plugin, loadEnv } from 'vite';
import {
  uploadMedia,
  translate,
  validateAssets,
  listUploads,
  deleteImage,
} from '../server/api-handlers.js';

/** Reads a JSON body from a Node http.IncomingMessage. */
function readJsonBody(req: import('http').IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/** Sends a { status, body } result object as an HTTP response. */
function sendResult(
  res: import('http').ServerResponse,
  result: { status: number; body: unknown },
) {
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result.body));
}

export function devServerApiPlugin(): Plugin {
  return {
    name: 'dev-server-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      const API_KEY = env.LIBRETRANSLATE_API_KEY;
      const API_URL = env.LIBRETRANSLATE_API_URL || 'http://localhost:5000/translate';

      server.middlewares.use(async (req, res, next) => {
        const rootDir = process.cwd();

        try {
          // ── POST routes ─────────────────────────────────
          if (req.method === 'POST' && (req.url === '/api/upload-image' || req.url === '/api/upload-media')) {
            const result = await uploadMedia(rootDir, req.headers, req);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } else if (req.method === 'POST' && req.url === '/api/translate') {
            const body = await readJsonBody(req);
            const result = await translate(body, API_URL, API_KEY);
            sendResult(res, result);
          } else if (req.method === 'POST' && req.url === '/api/validate-assets') {
            const body = await readJsonBody(req);
            sendResult(res, validateAssets(rootDir, body));
          }
          // ── GET routes ──────────────────────────────────
          else if (req.method === 'GET' && req.url === '/api/list-uploads') {
            sendResult(res, listUploads(rootDir));
          }
          // ── DELETE routes ───────────────────────────────
          else if (req.method === 'DELETE' && req.url?.startsWith('/api/delete-image')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const imagePath = url.searchParams.get('path');
            sendResult(res, deleteImage(rootDir, imagePath));
          }
          // ── Auth stubs for dev (always succeed) ─────────
          else if (req.method === 'POST' && req.url === '/api/login') {
            const body = await readJsonBody(req);
            const adminPassword = env.ADMIN_PASSWORD;
            if (!adminPassword || body.password !== adminPassword) {
              sendResult(res, { status: 401, body: { error: 'Invalid password' } });
            } else {
              sendResult(res, { status: 200, body: { token: 'dev-token' } });
            }
          } else if (req.method === 'POST' && req.url === '/api/logout') {
            sendResult(res, { status: 200, body: { success: true } });
          }
          // ── Not an API route ────────────────────────────
          else {
            next();
          }
        } catch (error) {
          console.error('Dev API error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }));
        }
      });
    }
  };
}
