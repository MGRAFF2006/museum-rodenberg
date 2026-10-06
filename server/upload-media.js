import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import busboy from 'busboy';

export const UPLOAD_LIMITS = { files: 4, fileBytes: 50 * 1024 * 1024 };
const REQUEST_BYTES = UPLOAD_LIMITS.files * UPLOAD_LIMITS.fileBytes + 64 * 1024;

export class UploadError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Deliberately excludes active documents (including SVG and HTML). This checks
// browser media type/extension agreement, not the safety of every media byte.
const MEDIA_TYPES = {
  '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'], '.png': ['image/png'],
  '.gif': ['image/gif'], '.webp': ['image/webp'], '.avif': ['image/avif'],
  '.bmp': ['image/bmp', 'image/x-ms-bmp'],
  '.mp3': ['audio/mpeg'], '.wav': ['audio/wav', 'audio/x-wav', 'audio/wave'],
  '.ogg': ['audio/ogg'], '.oga': ['audio/ogg'], '.flac': ['audio/flac', 'audio/x-flac'],
  '.aac': ['audio/aac'], '.m4a': ['audio/mp4', 'audio/x-m4a'],
  '.mp4': ['video/mp4'], '.m4v': ['video/mp4', 'video/x-m4v'],
  '.webm': ['video/webm', 'audio/webm'], '.ogv': ['video/ogg'],
  '.mov': ['video/quicktime'],
};

/** Write a bounded multipart request; failures roll back all its new files. */
export async function uploadMedia(rootDir, headers, reqStream) {
  if (Number(headers['content-length']) > REQUEST_BYTES) {
    throw new UploadError('Upload request is too large', 413);
  }
  let parser;
  try {
    parser = busboy({ headers, limits: {
      files: UPLOAD_LIMITS.files, fileSize: UPLOAD_LIMITS.fileBytes + 1,
      fields: 0, parts: UPLOAD_LIMITS.files + 1,
    } });
  } catch {
    throw new UploadError('A valid multipart upload is required');
  }

  const uploadDir = path.resolve(rootDir, 'public/uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const assets = [];
  const createdFiles = [];
  const writes = [];
  const controller = new AbortController();
  let failure;
  let requestBytes = 0;
  const fail = (error) => {
    if (failure) return;
    failure = error;
    // Busboy finishes processing its current chunk before destruction. Destroying
    // it inside its synchronous 'limit' callback corrupts its parser state.
    queueMicrotask(() => {
      reqStream.unpipe(parser);
      controller.abort();
      parser.destroy(error);
      reqStream.resume();
    });
  };
  const onRequestError = (error) => fail(error);
  const onData = (chunk) => {
    requestBytes += Buffer.byteLength(chunk);
    if (requestBytes > REQUEST_BYTES) fail(new UploadError('Upload request is too large', 413));
  };
  const onAborted = () => fail(new UploadError('Upload was interrupted'));
  const onClosed = () => {
    if (!reqStream.complete && !reqStream.readableEnded) onAborted();
  };
  reqStream.on('error', onRequestError);
  reqStream.on('aborted', onAborted);
  reqStream.on('close', onClosed);
  reqStream.on('data', onData);

  const parsed = new Promise((resolve, reject) => {
    parser.once('finish', resolve);
    parser.once('error', reject);
  });
  parser.on('filesLimit', () => fail(new UploadError('Upload at most 4 files at a time', 413)));
  parser.on('partsLimit', () => fail(new UploadError('Too many multipart parts', 413)));
  parser.on('fieldsLimit', () => fail(new UploadError('Form fields are not supported', 413)));
  parser.on('file', (_name, file, { filename, mimeType }) => {
    // Rejected parts may still be open when Busboy destroys them with an error.
    // They need a listener even when no output pipeline will be created.
    file.once('error', fail);
    if (failure) return file.resume();
    if (typeof filename !== 'string' || !filename.trim()) {
      file.resume();
      return fail(new UploadError('Every upload needs a filename'));
    }
    const extension = path.extname(filename).toLowerCase();
    if (!MEDIA_TYPES[extension]?.includes(mimeType)) {
      file.resume();
      return fail(new UploadError('Unsupported media type or filename extension', 415));
    }
    const id = randomUUID();
    const destination = path.join(uploadDir, `${id}${extension}`);
    const output = fs.createWriteStream(destination, { flags: 'wx' });
    // Only unlink files we created; an unlikely exclusive-open collision must
    // never remove a pre-existing asset.
    output.once('open', () => createdFiles.push(destination));
    file.once('limit', () => fail(new UploadError('Each file must be at most 50 MiB', 413)));
    writes.push(pipeline(file, output, { signal: controller.signal }).catch(fail));
    assets.push({ id, name: filename, alt: filename, url: `/uploads/${id}${extension}`, type: mimeType.split('/')[0] });
  });

  try {
    if (reqStream.destroyed && !reqStream.readableEnded) onAborted();
    reqStream.pipe(parser);
    try {
      await parsed;
    } catch (error) {
      fail(failure ?? new UploadError('Malformed multipart upload'));
    }
    await Promise.all(writes);
    if (failure) throw failure;
    if (!assets.length) throw new UploadError('Upload at least one media file');
    const urls = assets.map((asset) => asset.url);
    return { urls, url: urls[0], assets };
  } catch (error) {
    await Promise.all(createdFiles.map((file) => fs.promises.rm(file, { force: true })));
    throw error;
  } finally {
    reqStream.off('error', onRequestError);
    reqStream.off('aborted', onAborted);
    reqStream.off('close', onClosed);
    reqStream.off('data', onData);
  }
}
