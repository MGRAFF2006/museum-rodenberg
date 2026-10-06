import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { uploadMedia, translate, validateAssets, listUploads, deleteImage } from './api-handlers.js';

export function createApp({ rootDir, env = process.env, serveStatic = true }) {
  const ROOT_DIR = rootDir;
  const app = express();
  const API_KEY = env.LIBRETRANSLATE_API_KEY;
  const API_URL = env.LIBRETRANSLATE_API_URL || 'http://localhost:5000/translate';
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
  // Accept bare Docker service addresses as well as absolute URLs.
  let CONVEX_BACKEND_URL = env.CONVEX_BACKEND_URL || '';
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
      ws: false,
      on: {
        error: (err, _req, res) => {
          console.error('Convex proxy error:', err.message);
          if (typeof res.writeHead === 'function' && !res.headersSent) {
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

  app.disable('x-powered-by');
  app.set('trust proxy', Number(env.TRUST_PROXY || 0));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  // ── Session token store (in-memory; resets on server restart) ───
  const loginAttempts = new Map();
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
    const { password } = req.body || {};
    const now = Date.now();
    for (const [ip, attempt] of loginAttempts) {
      if (attempt.until <= now) loginAttempts.delete(ip);
    }
    const ip = req.ip;
    const attempt = loginAttempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (attempt.count >= 10 || loginAttempts.size >= 10000) {
      res.setHeader('Retry-After', '900');
      return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }
    attempt.count++;
    loginAttempts.set(ip, attempt);
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    loginAttempts.delete(ip);
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

  app.post(['/api/upload-media', '/api/upload-image'], requireAuth, async (req, res) => {
    try {
      const result = await uploadMedia(ROOT_DIR, req.headers, req);
      res.json(result);
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to upload media' });
    }
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

  // Only these internal functions can be invoked using the deployment key.
  const adminClient = CONVEX_BACKEND_URL && env.CONVEX_SELF_HOSTED_ADMIN_KEY
    ? new ConvexHttpClient(CONVEX_BACKEND_URL) : null;
  if (adminClient) adminClient.setAdminAuth(env.CONVEX_SELF_HOSTED_ADMIN_KEY);
  const allowedMutations = new Set([
    'exhibitions:save', 'exhibitions:remove', 'exhibitions:setFeatured',
    'artifacts:save', 'artifacts:remove', 'assets:save', 'assets:remove',
  ]);
  app.post('/api/admin/mutation', requireAuth, async (req, res) => {
    const { name, args } = req.body || {};
    if (!allowedMutations.has(name) || !args || typeof args !== 'object' || Array.isArray(args)) {
      return res.status(400).json({ error: 'Invalid content operation' });
    }
    if (!adminClient) return res.status(503).json({ error: 'Content backend is not configured' });
    try {
      const value = await adminClient.mutation(makeFunctionReference(name), args);
      res.json({ value: value ?? null });
    } catch (error) {
      console.error('Content operation failed:', error.message);
      res.status(502).json({ error: 'Content operation failed' });
    }
  });

  app.get('/healthz', async (_req, res) => {
    if (!CONVEX_BACKEND_URL) return res.json({ status: 'ok' });
    try {
      const response = await fetch(`${CONVEX_BACKEND_URL}/version`, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('Backend unavailable');
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));

  // ── Serve static files (production) ─────────────────────────────

  if (serveStatic) {
  const distDir = path.resolve(ROOT_DIR, 'dist');
  // Always serve public/uploads for media files (persistent upload volume)
  // Cache for 7 days — filenames don't change but content rarely does
  app.use(
    '/uploads',
    express.static(path.resolve(ROOT_DIR, 'public/uploads'), {
      maxAge: '7d',
    })
  );

  app.use('/uploads', (_req, res) => res.status(404).end());
  if (fs.existsSync(distDir)) {
    // Vite hashes asset filenames (e.g. index-abc123.js) — safe to cache forever
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );
    // Other dist files (index.html handled separately below, but SW manifest, etc.)
    app.use(express.static(distDir, { maxAge: '10m', index: false, setHeaders: (res, file) => {
      if (file.endsWith('.html') || file.endsWith('/sw.js')) res.setHeader('Cache-Control', 'no-cache');
    } }));
  }
  // SPA fallback — serve index.html for any non-API, non-static route
  // Must never be cached so deploys are picked up immediately
  app.get('{*path}', (req, res) => {
    if (path.extname(req.path)) return res.status(404).end();
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build not found. Run "npm run build" first.');
    }
  });

  }
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : 'Invalid request' });
  });
  return { app, convexProxy };
}

/** HTTP mounts strip /convex; upgrade requests need the same normalization. */
export function upgradeConvex(proxy, req, socket, head) {
  if (!proxy || !/^\/convex(?:\/|\?|$)/.test(req.url || '')) return;
  req.url = req.url.replace(/^\/convex/, '') || '/';
  proxy.upgrade(req, socket, head);
}
