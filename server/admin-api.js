import express from 'express';
import crypto from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { uploadMedia, translate, validateAssets, listUploads, deleteImage } from './api-handlers.js';

const CONTENT_WRITES = new Set([
  'artifacts:save', 'artifacts:remove', 'assets:save', 'assets:remove',
  'exhibitions:save', 'exhibitions:remove', 'exhibitions:setFeatured',
]);
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** The same password, session checks, and protected routes in production and Vite. */
export function createAdminApi(rootDir, env) {
  const router = express();
  const sessions = new Map();
  const loginAttempts = new Map();
  const backendUrl = env.CONVEX_BACKEND_URL || env.CONVEX_SELF_HOSTED_URL;
  const client = backendUrl ? new ConvexHttpClient(backendUrl) : null;
  // Socket address is deliberate: untrusted X-Forwarded-For must not bypass limits.
  // Reverse proxies share a bucket until a trusted proxy policy is configured.
  router.use('/login', (req, res, next) => {
    const now = Date.now();
    for (const [address, attempt] of loginAttempts) {
      if (now >= attempt.until) loginAttempts.delete(address);
    }
    const address = req.socket.remoteAddress || 'unknown';
    let attempt = loginAttempts.get(address);
    if (!attempt && loginAttempts.size >= 1000) {
      return res.status(503).json({ error: 'Login temporarily unavailable' });
    }
    if (!attempt) {
      attempt = { count: 0, until: now + 15 * 60 * 1000 };
      loginAttempts.set(address, attempt);
    }
    if (attempt.count >= 10) {
      res.set('Retry-After', String(Math.ceil((attempt.until - now) / 1000)));
      return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }
    attempt.count++;
    next();
  });
  router.use(express.json({ limit: '10mb' }));

  router.post('/login', (req, res) => {
    if (!env.ADMIN_PASSWORD || req.body?.password !== env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    for (const [token, expiry] of sessions) {
      if (Date.now() >= expiry) sessions.delete(token);
    }
    loginAttempts.delete(req.socket.remoteAddress || 'unknown');
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL_MS);
    res.json({ token });
  });
  router.post('/logout', (req, res) => {
    sessions.delete(req.headers.authorization?.replace(/^Bearer /, ''));
    res.json({ success: true });
  });
  router.use((req, res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7) : undefined;
    const expiry = sessions.get(token);
    if (!expiry || Date.now() >= expiry) {
      sessions.delete(token);
      return res.status(401).json({ error: 'Authentication required' });
    }
    sessions.set(token, Date.now() + SESSION_TTL_MS);
    next();
  });

  router.post('/content-write', async (req, res) => {
    const { operation, args } = req.body || {};
    if (!CONTENT_WRITES.has(operation) || !args || typeof args !== 'object' || Array.isArray(args)) {
      return res.status(400).json({ error: 'Invalid content operation' });
    }
    if (!client || !env.CONVEX_WRITE_SECRET) {
      return res.status(503).json({ error: 'Content writes are not configured' });
    }
    try {
      const result = await client.mutation(makeFunctionReference(operation), {
        ...args, serverSecret: env.CONVEX_WRITE_SECRET,
      });
      res.json({ result: result ?? null });
    } catch (error) {
      if (error?.data?.code === 'STALE_CONTENT') {
        return res.status(409).json({ error: 'Content changed. Reopen it before saving.', code: 'STALE_CONTENT' });
      }
      // Convex errors can include function arguments. Never echo or log credentials.
      res.status(502).json({ error: 'Failed to write content' });
    }
  });

  router.post(['/upload-media', '/upload-image'], async (req, res) => {
    try { res.json(await uploadMedia(rootDir, req.headers, req)); }
    catch (error) {
      const status = [400, 413, 415].includes(error.status) ? error.status : 500;
      res.status(status).json({ error: status === 500 ? 'Failed to upload media' : error.message });
    }
  });
  router.post('/translate', async (req, res) => {
    try {
      const result = await translate(req.body, env.LIBRETRANSLATE_API_URL || 'http://localhost:5000/translate', env.LIBRETRANSLATE_API_KEY);
      res.status(result.status).json(result.body);
    } catch { res.status(500).json({ error: 'Failed to translate' }); }
  });
  router.post('/validate-assets', (req, res) => {
    const result = validateAssets(rootDir, req.body);
    res.status(result.status).json(result.body);
  });
  router.get('/list-uploads', (_req, res) => {
    const result = listUploads(rootDir);
    res.status(result.status).json(result.body);
  });
  router.delete('/delete-image', (req, res) => {
    const result = deleteImage(rootDir, req.query.path);
    res.status(result.status).json(result.body);
  });
  router.use((err, _req, res, _next) => {
    const status = [400, 413].includes(err.status) ? err.status : 500;
    res.status(status).json({ error: status === 413 ? 'Request body too large' : status === 400 ? 'Invalid request body' : 'Admin API request failed' });
  });
  return router;
}
