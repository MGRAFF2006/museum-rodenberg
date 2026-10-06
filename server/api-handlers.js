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
import { randomUUID } from 'node:crypto';
import { Transform } from 'node:stream';
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
function uploadError(status, message) {
  return Object.assign(new Error(message), { status });
}

// Only passive browser media is served from the museum's origin. Signatures
// identify the container; full codec decoding remains the browser's job.
function mediaFormat(filename) {
  const extension = path.extname(filename).slice(1).toLowerCase();
  const matches = (bytes, text, offset = 0) => bytes.subarray(offset, offset + text.length).equals(Buffer.from(text));
  const riff = (bytes, kind) => matches(bytes, 'RIFF') && matches(bytes, kind, 8);
  const frame = bytes => bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  const formats = {
    jpg: ['image', bytes => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))],
    png: ['image', bytes => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))],
    gif: ['image', bytes => matches(bytes, 'GIF87a') || matches(bytes, 'GIF89a')],
    webp: ['image', bytes => riff(bytes, 'WEBP')],
    avif: ['image', bytes => matches(bytes, 'ftyp', 4) && (matches(bytes, 'avif', 8) || matches(bytes, 'avis', 8))],
    mp3: ['audio', bytes => matches(bytes, 'ID3') || frame(bytes)],
    wav: ['audio', bytes => riff(bytes, 'WAVE')],
    ogg: ['audio', bytes => matches(bytes, 'OggS')],
    flac: ['audio', bytes => matches(bytes, 'fLaC')],
    aac: ['audio', bytes => frame(bytes)],
    mp4: ['video', bytes => matches(bytes, 'ftyp', 4)],
    m4a: ['audio', bytes => matches(bytes, 'ftyp', 4)],
    mov: ['video', bytes => matches(bytes, 'ftyp', 4)],
    webm: ['video', bytes => bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))],
  };
  const canonical = extension === 'jpeg' ? 'jpg' : extension === 'opus' ? 'ogg' : extension;
  const format = formats[canonical];
  if (!format) throw uploadError(415, 'Unsupported media format');
  return { extension: canonical, type: format[0], matches: format[1] };
}

function validateMediaHeader(format) {
  let header = Buffer.alloc(0);
  let validated = false;
  const validate = () => {
    if (!format.matches(header)) throw uploadError(415, 'File contents do not match the media format');
    validated = true;
  };
  return new Transform({
    transform(chunk, _encoding, callback) {
      if (validated) return callback(null, chunk);
      const needed = 64 - header.length;
      header = Buffer.concat([header, chunk.subarray(0, needed)]);
      if (header.length < 64) return callback();
      try { validate(); this.push(header); callback(null, chunk.subarray(needed)); }
      catch (error) { callback(error); }
    },
    flush(callback) {
      try { if (!validated) { validate(); this.push(header); } callback(); }
      catch (error) { callback(error); }
    },
  });
}

export async function uploadMedia(rootDir, headers, reqStream) {
  let bb;
  try { bb = busboy({ headers, limits: { fileSize: 100 * 1024 * 1024, files: 10, fields: 0, parts: 11 } }); }
  catch { throw uploadError(400, 'A multipart upload is required'); }
  const uploadDir = path.resolve(rootDir, 'public/uploads');
  if (reqStream.destroyed || reqStream.aborted) throw uploadError(400, 'Upload interrupted');
  fs.mkdirSync(uploadDir, { recursive: true });
  const assets = [], writes = [], created = [];
  let failure;
  const fail = error => {
    failure ||= error;
    reqStream.unpipe(bb);
    reqStream.resume();
    if (!bb.destroyed) bb.destroy(error);
  };
  const aborted = () => fail(uploadError(400, 'Upload interrupted'));
  reqStream.on('aborted', aborted);
  reqStream.on('error', fail);
  const parsed = new Promise(resolve => {
    bb.on('finish', resolve);
    bb.on('error', () => { fail(failure || uploadError(400, 'Invalid multipart upload')); resolve(); });
  });
  bb.on('filesLimit', () => fail(uploadError(413, 'Upload at most 10 files at once')));
  bb.on('partsLimit', () => fail(uploadError(413, 'Upload at most 10 files at once')));
  bb.on('fieldsLimit', () => fail(uploadError(400, 'Only media files are accepted')));
  bb.on('file', (_name, file, { filename }) => {
    file.on('error', fail);
    file.on('limit', () => fail(uploadError(413, 'Each media file must be smaller than 100 MiB')));
    try {
      if (!filename || filename === '.' || filename === '..') throw uploadError(400, 'A media filename is required');
      const format = mediaFormat(filename);
      const id = randomUUID();
      const saveTo = path.join(uploadDir, `${id}.${format.extension}`);
      const output = fs.createWriteStream(saveTo, { flags: 'wx' });
      output.on('open', () => created.push(saveTo));
      writes.push(pipeline(file, validateMediaHeader(format), output).catch(fail));
      assets.push({ id, name: filename, alt: filename, url: `/uploads/${id}.${format.extension}`, type: format.type });
    } catch (error) { fail(error); }
  });
  reqStream.pipe(bb);
  await parsed;
  await Promise.all(writes);
  reqStream.off('aborted', aborted);
  reqStream.off('error', fail);
  if (failure || assets.length === 0) {
    await Promise.all(created.map(filename => fs.promises.unlink(filename).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    })));
    throw failure || uploadError(400, 'Select at least one media file');
  }
  const urls = assets.map(asset => asset.url);
  return { urls, url: urls[0], assets };
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
