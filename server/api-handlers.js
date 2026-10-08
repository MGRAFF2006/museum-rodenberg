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
import { randomUUID } from 'node:crypto';
import { protectMarkdownDestinations } from '../src/utils/markdownParsing.js';

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
export { uploadMedia } from './upload-media.js';

// ── Translation proxy ───────────────────────────────────────────

export async function translate(body, apiUrl, apiKey) {
  const { text, target } = body || {};
  if (typeof text !== 'string' || !text.trim() || typeof target !== 'string' || !['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'].includes(target)) {
    return { status: 400, body: { error: 'Text and target language are required' } };
  }
  try {
    if (!['http:', 'https:'].includes(new URL(apiUrl).protocol)) throw new Error('Invalid protocol');
  } catch {
    return { status: 503, body: { error: 'Translation service is not configured', retryable: false } };
  }

  // Protect Markdown URLs and images
  const tokenNamespace = randomUUID().replaceAll('-', '');
  const { text: protectedText, destinations: placeholders } = protectMarkdownDestinations(text, tokenNamespace);

  const deadline = AbortSignal.timeout(30_000);
  let response;
  try { response = await fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify({
      q: protectedText,
      source: 'de',
      target,
      format: 'text',
      api_key: apiKey,
    }),
    headers: { 'Content-Type': 'application/json' },
    signal: deadline,
  }); } catch {
    return { status: deadline.aborted ? 504 : 502, body: { error: 'Translation service is unavailable', retryable: true } };
  }

  if (!response.ok) {
    const retryable = [408, 429].includes(response.status) || response.status >= 500;
    await response.body?.cancel().catch(() => console.warn('Could not close rejected translation response'));
    // Provider authentication failures must not look like an expired editor login.
    return { status: response.status === 429 ? 429 : 502, body: { error: 'Translation service rejected the request', retryable } };
  }

  let data;
  try { data = await response.json(); }
  catch (error) {
    return { status: deadline.aborted ? 504 : 502, body: { error: 'Invalid translation response', retryable: deadline.aborted || !(error instanceof SyntaxError) } };
  }
  let translatedText = data?.translatedText;

  if (typeof translatedText !== 'string' || !translatedText.trim()) {
    return { status: 502, body: { error: 'Invalid translation response', retryable: false } };
  }

  // A request-specific namespace keeps literal ASSETURL/URL prose untouched.
  // Restore in one callback to preserve literal '$' characters and multi-digit indices.
  translatedText = translatedText.replace(
    new RegExp(`__\\s*${tokenNamespace}\\s*_\\s*(\\d+)\\s*__`, 'gi'),
    (match, index) => placeholders[Number(index)] ?? match,
  );
  // Preserve all surrounding Markdown whitespace; translator output may already
  // be valid and normalizing optional image prefixes consumed prose separators.

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
    if (!fullPath) return true;
    try { return !fs.statSync(fullPath).isFile(); }
    catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return true;
      throw error;
    }
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

  try {
    if (!fs.statSync(fullPath).isFile()) {
      return { status: 400, body: { error: 'Path must identify a media file' } };
    }
    fs.unlinkSync(fullPath);
  } catch (error) {
    // Retrying after a file-first deletion must still allow metadata cleanup.
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  return { status: 200, body: { success: true } };
}
