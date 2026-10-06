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
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';

function isWithinDirectory(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function resolveUploadPath(rootDir, uploadPath) {
  if (typeof uploadPath !== 'string' || !uploadPath.startsWith('/uploads/') || uploadPath.includes('\0')) {
    return null;
  }

  const uploadDir = path.resolve(rootDir, 'public/uploads');
  const fullPath = path.resolve(uploadDir, uploadPath.slice('/uploads/'.length));
  if (!isWithinDirectory(uploadDir, fullPath)) return null;

  try {
    // Canonical paths also catch symlinked parent directories that escape uploads.
    const canonicalDir = fs.realpathSync(uploadDir);
    if (!isWithinDirectory(canonicalDir, fs.realpathSync(fullPath))) return null;
  } catch (error) {
    // Missing files still follow the callers' existing 404 / invalid-asset behavior.
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }

  return fullPath;
}

// ── File upload ─────────────────────────────────────────────────

/**
 * Handle file upload via busboy. Returns a Promise that resolves with
 * { urls, url, assets } when all files have been written to disk.
 * Asset metadata is NOT written to any JSON file — the client saves
 * it to Convex after the upload completes.
 */
const MEDIA_EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'],
  ['image/gif', '.gif'], ['image/avif', '.avif'], ['audio/mpeg', '.mp3'],
  ['audio/wav', '.wav'], ['audio/x-wav', '.wav'], ['audio/ogg', '.ogg'],
  ['audio/mp4', '.m4a'], ['audio/webm', '.webm'], ['audio/flac', '.flac'],
  ['video/mp4', '.mp4'], ['video/webm', '.webm'], ['video/ogg', '.ogv'],
]);

export async function uploadMedia(rootDir, headers, reqStream) {
  const uploadDir = path.resolve(rootDir, 'public/uploads');
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const urls = [];
  const assets = [];
  const writes = [];
  const createdPaths = [];
  let failure;
  const invalidUpload = (message, status = 400) => Object.assign(new Error(message), { status });
  try {
    await new Promise((resolve, reject) => {
      let bb;
      try {
        bb = busboy({ headers, limits: { fileSize: 100 * 1024 * 1024, files: 10, fields: 10, parts: 20 } });
      } catch {
        reject(invalidUpload('A multipart file upload is required'));
        return;
      }
      bb.on('file', (_name, file, { filename, mimeType }) => {
        const extension = MEDIA_EXTENSIONS.get(mimeType);
        if (!extension) {
          failure = invalidUpload('Unsupported media type', 415);
          file.resume();
          return;
        }
        const id = crypto.randomUUID();
        const saveTo = path.join(uploadDir, `${id}${extension}`);
        const url = `/uploads/${id}${extension}`;
        createdPaths.push(saveTo);
        urls.push(url);
        assets.push({ id, name: filename, alt: filename, url, type: mimeType.split('/')[0] });
        writes.push(pipeline(file, fs.createWriteStream(saveTo, { flags: 'wx' }))
          .then(() => {
            if (file.truncated) throw invalidUpload('File exceeds the 100 MiB limit', 413);
          }).catch((error) => { failure = error; }));
      });
      for (const event of ['filesLimit', 'fieldsLimit', 'partsLimit']) {
        bb.on(event, () => { failure = invalidUpload('Too many upload parts', 413); });
      }
      bb.once('close', resolve);
      bb.once('error', reject);
      reqStream.once('aborted', () => bb.destroy(invalidUpload('Upload aborted')));
      reqStream.once('error', (error) => bb.destroy(error));
      reqStream.pipe(bb);
    });
    await Promise.all(writes);
    if (failure) throw failure;
    if (!urls.length) throw invalidUpload('No media files supplied');
    return { urls, url: urls[0], assets };
  } catch (error) {
    await Promise.all(writes);
    await Promise.all(createdPaths.map((file) => fs.promises.rm(file, { force: true })));
    throw error;
  }
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
    signal: AbortSignal.timeout(60000),
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

  const invalid = paths.filter((p) => {
    if (!p || typeof p !== 'string') return false;
    if (!p.startsWith('/uploads/')) return false;
    const fullPath = resolveUploadPath(rootDir, p);
    return !fullPath || !fs.existsSync(fullPath);
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
  const fullPath = resolveUploadPath(rootDir, imagePath);
  if (!fullPath) {
    return { status: 400, body: { error: 'Invalid path' } };
  }

  if (!fs.existsSync(fullPath)) {
    return { status: 404, body: { error: 'File not found' } };
  }

  fs.unlinkSync(fullPath);
  return { status: 200, body: { success: true } };
}
