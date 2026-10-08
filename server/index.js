/**
 * Standalone Express API server for Museum Rodenberg.
 *
 * In development, these same endpoints are served via the Vite dev-server plugin
 * (scripts/dev-server-plugin.ts) for convenience. Both use the shared handler
 * routes in server/admin-api.js.
 *
 * Usage:
 *   node server/index.js                  # serves API + static dist/
 *   PORT=4000 node server/index.js        # custom port
 *
 * Environment variables (loaded from .env):
 *   ADMIN_PASSWORD             - Admin panel password (server-side only)
 *   LIBRETRANSLATE_API_KEY     - API key for LibreTranslate
 *   LIBRETRANSLATE_API_URL     - LibreTranslate endpoint (default: http://localhost:5000/translate)
 *   CONVEX_BACKEND_URL         - Internal Convex backend URL for reverse proxy (e.g. http://convex-internal:3210)
 *   CONVEX_WRITE_SECRET        - Server-only credential matching the Convex deployment
 *   CONVEX_SELF_HOSTED_URL      - Direct Convex URL when no reverse proxy is configured
 *   PORT                       - HTTP port (default: 3000)
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { serveMuseumFiles } from './static-files.js';

import { createAdminApi } from './admin-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
// Auto-prepend http:// if someone forgets the protocol (common with Sevalla internal URLs)
let CONVEX_BACKEND_URL = process.env.CONVEX_BACKEND_URL || '';
if (CONVEX_BACKEND_URL && !CONVEX_BACKEND_URL.startsWith('http://') && !CONVEX_BACKEND_URL.startsWith('https://')) {
  CONVEX_BACKEND_URL = `http://${CONVEX_BACKEND_URL}`;
  console.log(`CONVEX_BACKEND_URL was missing protocol — auto-prepended http://`);
}

// ── Convex reverse proxy (HTTPS → internal HTTP) ────────────────
// Browsers require wss:// from https:// pages. This proxy lets the
// Convex client connect to /convex on the museum app's own origin,
// and forwards both HTTP and WebSocket traffic to the internal
// Convex backend over plain HTTP (server-to-server).
let convexProxy = null;
if (CONVEX_BACKEND_URL) {
  console.log(`Convex reverse proxy: /convex → ${CONVEX_BACKEND_URL}`);
  convexProxy = createProxyMiddleware({
    target: CONVEX_BACKEND_URL,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/convex': '' },
    on: {
      error: (err, _req, res) => {
        console.error('Convex proxy error:', err.message);
        if (res.writeHead) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Convex backend unreachable' }));
        }
      },
    },
  });
  app.use('/convex', convexProxy);
} else {
  console.log('CONVEX_BACKEND_URL not set — Convex reverse proxy disabled (direct connection).');
}

app.use(cors());

app.use('/api', createAdminApi(ROOT_DIR, { ...process.env, CONVEX_BACKEND_URL }));

// ── Serve static files (production) ─────────────────────────────

const distDir = path.resolve(ROOT_DIR, 'dist');
serveMuseumFiles(app, ROOT_DIR);

const server = app.listen(PORT, () => {
  console.log(`Museum Rodenberg server listening on http://localhost:${PORT}`);
  console.log(`  API endpoints:  /api/*`);
  console.log(`  Static files:   ${fs.existsSync(distDir) ? distDir : '(not built yet — run "npm run build")'}`);
  if (CONVEX_BACKEND_URL) {
    console.log(`  Convex proxy:   /convex → ${CONVEX_BACKEND_URL}`);
  }
});

// ── WebSocket upgrade handling ──────────────────────────────────
// http-proxy-middleware v3 requires explicit upgrade event handling.
// Without this, only HTTP requests are proxied; WebSocket upgrades
// (which Convex uses for real-time sync) are silently dropped.
if (convexProxy) {
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/convex')) {
      convexProxy.upgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  });
  console.log('  WebSocket upgrade handler registered for /convex');
}
