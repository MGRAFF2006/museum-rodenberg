// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteImage, validateAssets } from '../../server/api-handlers.js';

describe('upload filesystem paths', () => {
  let rootDir: string;
  let uploadDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-upload-paths-'));
    uploadDir = path.join(rootDir, 'public/uploads');
    fs.mkdirSync(path.join(uploadDir, 'nested'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'server'));
    fs.writeFileSync(path.join(rootDir, 'server/sentinel.txt'), 'outside uploads');
    fs.mkdirSync(path.join(rootDir, 'public/uploads-backup'));
    fs.writeFileSync(path.join(rootDir, 'public/uploads-backup/sentinel.txt'), 'sibling');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it.each(['photo.jpg', 'nested/photo.jpg', '..photo.jpg'])('deletes and validates %s', (filename) => {
    const url = `/uploads/${filename}`;
    const file = path.join(uploadDir, filename);
    fs.writeFileSync(file, 'uploaded file');

    expect(validateAssets(rootDir, { paths: [url] }).body).toEqual({ invalid: [] });
    expect(deleteImage(rootDir, url)).toEqual({ status: 200, body: { success: true } });
    expect(fs.existsSync(file)).toBe(false);
    expect(deleteImage(rootDir, url)).toEqual({ status: 200, body: { success: true } });
  });

  it.each([
    '/uploads/../../server/sentinel.txt',
    '/uploads/../uploads-backup/sentinel.txt',
    '/uploads//server/sentinel.txt',
    '/uploads/',
    '/uploads/nested/..',
    '/uploads/photo.jpg\0',
  ])('rejects invalid upload path %s', (url) => {
    expect(deleteImage(rootDir, url).status).toBe(400);
    expect(validateAssets(rootDir, { paths: [url] }).body).toEqual({ invalid: [url] });
    expect(fs.readFileSync(path.join(rootDir, 'server/sentinel.txt'), 'utf8')).toBe('outside uploads');
    expect(fs.readFileSync(path.join(rootDir, 'public/uploads-backup/sentinel.txt'), 'utf8')).toBe('sibling');
  });

  it('rejects traversal decoded from the delete route query', () => {
    const query = new URL('http://localhost/api/delete-image?path=%2Fuploads%2F..%2F..%2Fserver%2Fsentinel.txt');
    expect(deleteImage(rootDir, query.searchParams.get('path')).status).toBe(400);
    expect(fs.existsSync(path.join(rootDir, 'server/sentinel.txt'))).toBe(true);
  });

  it('marks existing files outside uploads as invalid assets', () => {
    fs.symlinkSync(path.join(rootDir, 'server'), path.join(uploadDir, 'escape'));
    const paths = [
      '/uploads/../../server/sentinel.txt',
      '/uploads/../uploads-backup/sentinel.txt',
      '/uploads/escape/sentinel.txt',
    ];
    expect(validateAssets(rootDir, { paths }).body).toEqual({ invalid: paths });
  });

  it.each(['directory', 'file'])('rejects an escaping %s symlink', (kind) => {
    const target = path.join(rootDir, kind === 'directory' ? 'server' : 'server/sentinel.txt');
    fs.symlinkSync(target, path.join(uploadDir, 'escape'));
    const url = `/uploads/escape${kind === 'directory' ? '/sentinel.txt' : ''}`;

    expect(deleteImage(rootDir, url).status).toBe(400);
    expect(validateAssets(rootDir, { paths: [url] }).body).toEqual({ invalid: [url] });
    expect(fs.existsSync(path.join(rootDir, 'server/sentinel.txt'))).toBe(true);
  });

  it('supports a symlinked upload root and links within it', () => {
    const canonicalDir = path.join(rootDir, 'storage');
    fs.renameSync(uploadDir, canonicalDir);
    fs.symlinkSync(canonicalDir, uploadDir);
    fs.writeFileSync(path.join(canonicalDir, 'photo.jpg'), 'uploaded file');
    fs.symlinkSync('photo.jpg', path.join(canonicalDir, 'alias.jpg'));

    expect(validateAssets(rootDir, { paths: ['/uploads/alias.jpg'] }).body).toEqual({ invalid: [] });
    expect(deleteImage(rootDir, '/uploads/alias.jpg').status).toBe(200);
    expect(fs.existsSync(path.join(canonicalDir, 'photo.jpg'))).toBe(true);
  });

  it('keeps missing uploads and non-upload input behavior', () => {
    for (const url of ['/uploads/missing.jpg', '/uploads/missing/photo.jpg']) {
      expect(deleteImage(rootDir, url)).toEqual({ status: 200, body: { success: true } });
      expect(validateAssets(rootDir, { paths: [url] }).body).toEqual({ invalid: [url] });
    }
    for (const url of [null, '', '/other/photo.jpg']) {
      expect(deleteImage(rootDir, url).status).toBe(400);
    }
    expect(validateAssets(rootDir, { paths: [null, 12, '/other/photo.jpg', 'https://example.com/photo.jpg'] }).body)
      .toEqual({ invalid: [] });
    expect(validateAssets(rootDir, { paths: 'not an array' }).status).toBe(400);

    fs.rmSync(uploadDir, { recursive: true });
    expect(deleteImage(rootDir, '/uploads/missing.jpg')).toEqual({ status: 200, body: { success: true } });
  });

  it('rejects directories as assets or deletion targets without deleting their contents', () => {
    const sentinel = path.join(uploadDir, 'nested/photo.jpg');
    fs.writeFileSync(sentinel, 'museum media');
    expect(validateAssets(rootDir, { paths: ['/uploads/nested', '/uploads/nested/'] }).body)
      .toEqual({ invalid: ['/uploads/nested', '/uploads/nested/'] });
    expect(deleteImage(rootDir, '/uploads/nested').status).toBe(400);
    expect(fs.readFileSync(sentinel, 'utf8')).toBe('museum media');
  });

  it('keeps deletion idempotent if another request removes the file after validation', () => {
    const file = path.join(uploadDir, 'photo.jpg');
    fs.writeFileSync(file, 'museum media');
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => { throw Object.assign(new Error('Already removed'), { code: 'ENOENT' }); });
    expect(deleteImage(rootDir, '/uploads/photo.jpg')).toEqual({ status: 200, body: { success: true } });
  });

  it('does not turn a storage permission error into successful deletion', () => {
    const file = path.join(uploadDir, 'photo.jpg');
    fs.writeFileSync(file, 'museum media');
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => { throw Object.assign(new Error('Denied'), { code: 'EACCES' }); });
    expect(() => deleteImage(rootDir, '/uploads/photo.jpg')).toThrow('Denied');
    expect(fs.readFileSync(file, 'utf8')).toBe('museum media');
  });
});
