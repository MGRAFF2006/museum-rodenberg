/**
 * Shared API handler logic for Museum Rodenberg.
 *
 * Used by both the Express production server (server/index.js) and the Vite
 * dev-server plugin (scripts/dev-server-plugin.ts) so that API behaviour is
 * defined in one place.
 */

import fs from 'fs';
import path from 'path';
import busboy from 'busboy';

// ── Content CRUD ────────────────────────────────────────────────

export function saveContent(rootDir, body) {
  const { type, data } = body;
  if (!type || !data || !data.id) {
    return { status: 400, body: { error: 'Invalid data: type and data.id are required' } };
  }

  const filePath = path.resolve(rootDir, `src/content/${type === 'exhibition' ? 'exhibitions' : 'artifacts'}.json`);
  if (!fs.existsSync(filePath)) {
    return { status: 404, body: { error: `Content file not found: ${filePath}` } };
  }

  const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (type === 'exhibition') {
    if (!currentData.exhibitions) currentData.exhibitions = {};
    const existing = currentData.exhibitions[data.id] || {};
    currentData.exhibitions[data.id] = { ...existing, ...data };
  } else {
    if (!currentData.artifacts) currentData.artifacts = {};
    const existing = currentData.artifacts[data.id] || {};
    currentData.artifacts[data.id] = { ...existing, ...data };
  }

  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return { status: 200, body: { success: true } };
}

export function deleteContent(rootDir, body) {
  const { type, id } = body;
  if (!type || !id) {
    return { status: 400, body: { error: 'Type and ID are required' } };
  }

  const filePath = path.resolve(rootDir, `src/content/${type === 'exhibition' ? 'exhibitions' : 'artifacts'}.json`);
  if (!fs.existsSync(filePath)) {
    return { status: 404, body: { error: `Content file not found: ${filePath}` } };
  }

  const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const targetId = id.toLowerCase();

  if (type === 'exhibition') {
    if (currentData.exhibitions) {
      delete currentData.exhibitions[targetId];
    }
    if (currentData.featured === targetId) {
      const remaining = Object.keys(currentData.exhibitions || {});
      currentData.featured = remaining.length > 0 ? remaining[0] : '';
    }
  } else {
    if (currentData.artifacts) {
      delete currentData.artifacts[targetId];
    }
    // Also remove from any exhibitions that reference this artifact
    const exPath = path.resolve(rootDir, 'src/content/exhibitions.json');
    if (fs.existsSync(exPath)) {
      const exData = JSON.parse(fs.readFileSync(exPath, 'utf-8'));
      let changed = false;
      Object.values(exData.exhibitions || {}).forEach((ex) => {
        if (ex.artifacts && ex.artifacts.includes(targetId)) {
          ex.artifacts = ex.artifacts.filter((a) => a !== targetId);
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(exPath, JSON.stringify(exData, null, 2));
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return { status: 200, body: { success: true } };
}

// ── Asset management ────────────────────────────────────────────

export function saveAsset(rootDir, body) {
  const asset = body;
  if (!asset || !asset.id) {
    return { status: 400, body: { error: 'Asset ID is required' } };
  }

  const filePath = path.resolve(rootDir, 'src/content/assets.json');
  let currentData = { assets: {} };
  if (fs.existsSync(filePath)) {
    currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  if (!currentData.assets) currentData.assets = {};
  currentData.assets[asset.id] = { ...currentData.assets[asset.id], ...asset };

  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return { status: 200, body: { success: true } };
}

/**
 * Handle file upload via busboy. Returns a Promise that resolves with
 * { urls, url, assets } when all files have been written to disk and
 * assets.json has been updated.
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
      const filePath = path.resolve(rootDir, 'src/content/assets.json');
      let currentData = { assets: {} };
      if (fs.existsSync(filePath)) {
        currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
      if (!currentData.assets) currentData.assets = {};

      assets.forEach((asset) => {
        currentData.assets[asset.id] = asset;
      });

      fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
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

export function listUploads(rootDir) {
  const filePath = path.resolve(rootDir, 'src/content/assets.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return {
      status: 200,
      body: { files: Object.values(data.assets || {}).map((a) => a.url), assets: data.assets },
    };
  }

  const uploadDir = path.resolve(rootDir, 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const files = fs.readdirSync(uploadDir);
  return { status: 200, body: { files: files.map((f) => `/uploads/${f}`), assets: {} } };
}

// ── Delete image/media ──────────────────────────────────────────

export function deleteImage(rootDir, imagePath) {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) {
    return { status: 400, body: { error: 'Invalid path' } };
  }

  const fullPath = path.resolve(rootDir, 'public', imagePath.substring(1));
  if (!fs.existsSync(fullPath)) {
    return { status: 404, body: { error: 'File not found' } };
  }

  fs.unlinkSync(fullPath);

  // Also remove from assets.json
  const filePath = path.resolve(rootDir, 'src/content/assets.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (data.assets) {
      const assetId = Object.keys(data.assets).find((id) => data.assets[id].url === imagePath);
      if (assetId) {
        delete data.assets[assetId];
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    }
  }

  return { status: 200, body: { success: true } };
}
