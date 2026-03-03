/**
 * Shared API handler logic for Museum Rodenberg.
 *
 * Used by both the Express production server (server/index.js) and the Vite
 * dev-server plugin (scripts/dev-server-plugin.ts) so that API behaviour is
 * defined in one place.
 *
 * Content CRUD (exhibitions, artifacts, assets metadata) is now handled by
 * Convex mutations on the client side. This file only handles:
 *   - File upload/delete (disk operations)
 *   - Translation proxy (LibreTranslate)
 *   - Asset validation (checking files on disk)
 *   - Upload listing (physical files)
 */

import fs from 'fs';
import path from 'path';
import busboy from 'busboy';

// ── File upload ─────────────────────────────────────────────────

/**
 * Handle file upload via busboy. Returns a Promise that resolves with
 * { urls, url, assets } when all files have been written to disk.
 * Asset metadata is NOT written to any JSON file — the client saves
 * it to Convex after the upload completes.
 */
export function uploadMedia(rootDir, headers, reqStream) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers });
    const urls = [];
    const assets = [];
    const uploadDir = path.resolve(rootDir, 'public/uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    bb.on('file', (_name, file, info) => {
      const { filename, mimeType } = info;
      const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const id = safeFilename.replace(/\.[^/.]+$/, '');
      const saveTo = path.join(uploadDir, safeFilename);
      const url = `/uploads/${safeFilename}`;

      file.pipe(fs.createWriteStream(saveTo));
      urls.push(url);

      let type = 'other';
      if (mimeType.startsWith('image/')) type = 'image';
      else if (mimeType.startsWith('audio/')) type = 'audio';
      else if (mimeType.startsWith('video/')) type = 'video';

      assets.push({ id, name: filename, alt: filename, url, type });
    });

    bb.on('finish', () => {
      resolve({ urls, url: urls[0], assets });
    });

    bb.on('error', reject);

    reqStream.pipe(bb);
  });
}

// ── Translation proxy ───────────────────────────────────────────

export async function translate(body, apiUrl, apiKey) {
  const { text, target } = body;
  if (!text || !target) {
    return { status: 400, body: { error: 'Text and target language are required' } };
  }

  // Protect Markdown URLs and images
  const placeholders = [];
  const protectedText = text.replace(/(!?\[.*?\])\((.*?)\)/g, (_match, bracketed, url) => {
    placeholders.push(url);
    return `${bracketed}(ASSETURL${placeholders.length - 1})`;
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify({
      q: protectedText,
      source: 'de',
      target,
      format: 'text',
      api_key: apiKey,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`LibreTranslate Error: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  let translatedText = data.translatedText;

  // Restore URLs
  placeholders.forEach((url, i) => {
    const regex = new RegExp(`(ASSET\\s*URL\\s*${i})|(_*\\s*URL\\s*_*\\s*${i}\\s*_*)|(URL\\s*${i})`, 'gi');
    translatedText = translatedText.replace(regex, url);
  });

  // Fix potential broken Markdown syntax
  translatedText = translatedText.replace(/(!?)\s*\[\s*(.*?)\s*\]\s*\(\s*(.*?)\s*\)/g, '$1[$2]($3)');

  return { status: 200, body: { translatedText } };
}

// ── Asset validation ────────────────────────────────────────────

export function validateAssets(rootDir, body) {
  const { paths } = body;
  if (!Array.isArray(paths)) {
    return { status: 400, body: { error: 'Paths must be an array' } };
  }

  const uploadDir = path.resolve(rootDir, 'public/uploads');
  const invalid = paths.filter((p) => {
    if (!p || typeof p !== 'string') return false;
    if (!p.startsWith('/uploads/')) return false;
    const relativePath = p.replace('/uploads/', '');
    const fullPath = path.join(uploadDir, relativePath);
    return !fs.existsSync(fullPath);
  });

  return { status: 200, body: { invalid } };
}

// ── List uploads ────────────────────────────────────────────────

/**
 * Lists physical files in public/uploads/. Asset metadata is now
 * served from Convex on the client side.
 */
export function listUploads(rootDir) {
  const uploadDir = path.resolve(rootDir, 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const files = fs.readdirSync(uploadDir);
  return { status: 200, body: { files: files.map((f) => `/uploads/${f}`) } };
}

// ── Delete image/media ──────────────────────────────────────────

/**
 * Deletes a file from public/uploads/. Asset metadata removal from
 * Convex is handled by the client.
 */
export function deleteImage(rootDir, imagePath) {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) {
    return { status: 400, body: { error: 'Invalid path' } };
  }

  const fullPath = path.resolve(rootDir, 'public', imagePath.substring(1));
  if (!fs.existsSync(fullPath)) {
    return { status: 404, body: { error: 'File not found' } };
  }

  fs.unlinkSync(fullPath);
  return { status: 200, body: { success: true } };
}
