/**
 * Standalone Express API server for Museum Rodenberg.
 *
 * In development, these same endpoints are served via the Vite dev-server plugin
 * (scripts/dev-server-plugin.ts) for convenience. Both use the shared handler
 * logic in server/api-handlers.js.
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
 *   PORT                       - HTTP port (default: 3000)
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

import {
  uploadMedia,
  translate,
  validateAssets,
  listUploads,
  deleteImage,
} from './api-handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.LIBRETRANSLATE_API_KEY;
const API_URL = process.env.LIBRETRANSLATE_API_URL || 'http://localhost:5000/translate';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// Auto-prepend http:// if someone forgets the protocol (common with Sevalla internal URLs)
let CONVEX_BACKEND_URL = process.env.CONVEX_BACKEND_URL || '';
if (CONVEX_BACKEND_URL && !CONVEX_BACKEND_URL.startsWith('http://') && !CONVEX_BACKEND_URL.startsWith('https://')) {
  CONVEX_BACKEND_URL = `http://${CONVEX_BACKEND_URL}`;
  console.log(`CONVEX_BACKEND_URL was missing protocol — auto-prepended http://`);
}

if (!ADMIN_PASSWORD) {
  console.warn('WARNING: ADMIN_PASSWORD is not set. Admin API endpoints will reject all requests.');
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
app.use(express.json({ limit: '10mb' }));

// ── Session token store (in-memory; resets on server restart) ───
const activeSessions = new Map(); // token -> expiry timestamp
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, expiry] of activeSessions) {
    if (now > expiry) activeSessions.delete(token);
  }
}

// ── Auth endpoints ──────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  cleanExpiredSessions();
  const token = generateToken();
  activeSessions.set(token, Date.now() + SESSION_TTL_MS);
  res.json({ token });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) activeSessions.delete(token);
  res.json({ success: true });
});

// ── Auth middleware for protected routes ─────────────────────────

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  cleanExpiredSessions();
  const expiry = activeSessions.get(token);
  if (!expiry || Date.now() > expiry) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  // Refresh session TTL on activity
  activeSessions.set(token, Date.now() + SESSION_TTL_MS);
  next();
}

// ── Protected API routes (file operations, translation) ─────────

app.post('/api/upload-media', requireAuth, async (req, res) => {
  try {
    const result = await uploadMedia(ROOT_DIR, req.headers, req);
    res.json(result);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Legacy alias
app.post('/api/upload-image', requireAuth, (req, res, next) => {
  req.url = '/api/upload-media';
  next();
});

app.post('/api/translate', requireAuth, async (req, res) => {
  try {
    const result = await translate(req.body, API_URL, API_KEY);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error translating:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to translate' });
  }
});

app.post('/api/validate-assets', requireAuth, (req, res) => {
  try {
    const result = validateAssets(ROOT_DIR, req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate assets' });
  }
});

app.get('/api/list-uploads', requireAuth, (_req, res) => {
  try {
    const result = listUploads(ROOT_DIR);
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list uploads' });
  }
});

app.delete('/api/delete-image', requireAuth, (req, res) => {
  try {
    const result = deleteImage(ROOT_DIR, req.query.path);
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ── Serve static files (production) ─────────────────────────────

const distDir = path.resolve(ROOT_DIR, 'dist');
const distUploadsDir = path.join(distDir, 'uploads');
const publicUploadsDir = path.resolve(ROOT_DIR, 'public/uploads');

// Debug: log what upload directories contain at startup
console.log(`  dist/uploads:   ${fs.existsSync(distUploadsDir) ? fs.readdirSync(distUploadsDir).length + ' files' : 'MISSING'}`);
console.log(`  public/uploads: ${fs.existsSync(publicUploadsDir) ? fs.readdirSync(publicUploadsDir).length + ' files' : 'MISSING'}`);

// Temporary debug endpoint — remove after deployment is verified
app.get('/api/debug-uploads', (_req, res) => {
  const distFiles = fs.existsSync(distUploadsDir) ? fs.readdirSync(distUploadsDir) : [];
  const publicFiles = fs.existsSync(publicUploadsDir) ? fs.readdirSync(publicUploadsDir) : [];
  res.json({
    distDir,
    distUploadsDir,
    distUploadsExists: fs.existsSync(distUploadsDir),
    distUploadsFiles: distFiles,
    publicUploadsDir,
    publicUploadsExists: fs.existsSync(publicUploadsDir),
    publicUploadsFiles: publicFiles,
  });
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}
// Always serve public/uploads for media files
app.use('/uploads', express.static(publicUploadsDir));

// SPA fallback — serve index.html for any non-API, non-static route
app.get('{*path}', (_req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found. Run "npm run build" first.');
  }
});

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
