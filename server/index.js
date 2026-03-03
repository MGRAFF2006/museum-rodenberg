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
 *   PORT                       - HTTP port (default: 3000)
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import {
  saveContent,
  deleteContent,
  saveAsset,
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

if (!ADMIN_PASSWORD) {
  console.warn('WARNING: ADMIN_PASSWORD is not set. Admin API endpoints will reject all requests.');
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

// ── Protected Content CRUD ──────────────────────────────────────

app.post('/api/save-content', requireAuth, (req, res) => {
  try {
    const result = saveContent(ROOT_DIR, req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

app.post('/api/delete-content', requireAuth, (req, res) => {
  try {
    const result = deleteContent(ROOT_DIR, req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

app.post('/api/save-asset', requireAuth, (req, res) => {
  try {
    const result = saveAsset(ROOT_DIR, req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error saving asset:', error);
    res.status(500).json({ error: 'Failed to save asset' });
  }
});

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
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}
// Always serve public/uploads for media files
app.use('/uploads', express.static(path.resolve(ROOT_DIR, 'public/uploads')));

// SPA fallback — serve index.html for any non-API, non-static route
app.get('{*path}', (_req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found. Run "npm run build" first.');
  }
});

app.listen(PORT, () => {
  console.log(`Museum Rodenberg server listening on http://localhost:${PORT}`);
  console.log(`  API endpoints:  /api/*`);
  console.log(`  Static files:   ${fs.existsSync(distDir) ? distDir : '(not built yet — run "npm run build")'}`);
});
