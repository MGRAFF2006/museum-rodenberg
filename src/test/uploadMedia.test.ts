// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable, Writable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadMedia } from '../../server/api-handlers.js';
import { createAdminApi } from '../../server/admin-api.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN2kAAAAASUVORK5CYII=', 'base64');
const boundary = 'museum-upload-regression';
const headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
const part = (filename: string, bytes = png, mime = 'image/png') => Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`),
  bytes, Buffer.from('\r\n'),
]);
const end = Buffer.from(`--${boundary}--\r\n`);
const request = (parts: Buffer[]) => Readable.from([...parts, end]) as unknown as IncomingMessage;

describe('media upload safety', () => {
  let root: string;
  let uploads: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-upload-streams-'));
    uploads = path.join(root, 'public/uploads');
    fs.mkdirSync(uploads, { recursive: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('keeps duplicate and equivalent original names separate without overwriting existing bytes', async () => {
    fs.writeFileSync(path.join(uploads, 'photo.png'), 'existing museum image');
    const result = await uploadMedia(root, headers, request([
      part('Photo.PNG'), part('photo.png'), part('photo.jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), 'image/jpeg'),
    ]));
    expect(new Set(result.urls).size).toBe(3);
    const assets = result.assets as Array<{ id: string; name: string; url: string; type: string }>;
    expect(new Set(assets.map(asset => asset.id)).size).toBe(3);
    expect(assets.map(asset => asset.name)).toEqual(['Photo.PNG', 'photo.png', 'photo.jpeg']);
    for (const asset of assets) {
      expect(asset.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(asset.type).toBe('image');
      expect(fs.statSync(path.join(root, 'public', asset.url)).size).toBeGreaterThan(0);
    }
    expect(fs.readFileSync(path.join(root, 'public', result.urls[0]))).toEqual(png);
    expect(fs.readFileSync(path.join(uploads, 'photo.png'), 'utf8')).toBe('existing museum image');
  });

  it('does not resolve until the destination has finished writing', async () => {
    const original = fs.createWriteStream;
    let release!: () => void;
    let reached!: () => void;
    const finalReached = new Promise<void>(resolve => { reached = resolve; });
    vi.spyOn(fs, 'createWriteStream').mockImplementation((...args) => {
      const destination = original(...args);
      destination._final = callback => { release = callback; reached(); };
      return destination;
    });
    let resolved = false;
    const upload = uploadMedia(root, headers, request([part('photo.png')])).then(result => { resolved = true; return result; });
    await finalReached;
    expect(resolved).toBe(false);
    release();
    const result = await upload;
    expect(fs.readFileSync(path.join(root, 'public', result.url!))).toEqual(png);
  });

  it('rejects a destination write failure without an uncaught stream error', async () => {
    vi.spyOn(fs, 'createWriteStream').mockImplementation(() => new Writable({
      write(_chunk, _encoding, callback) { callback(Object.assign(new Error('Synthetic disk full'), { code: 'ENOSPC' })); },
    }) as fs.WriteStream);
    await expect(uploadMedia(root, headers, request([part('photo.png')]))).rejects.toMatchObject({ code: 'ENOSPC' });
    expect(fs.readdirSync(uploads)).toEqual([]);
  });

  it.each([
    ['page.html', '<script>alert(1)</script>', 'text/html'],
    ['image.svg', '<svg onload="alert(1)"></svg>', 'image/svg+xml'],
    ['image.png', '<html><script>alert(1)</script></html>', 'image/png'],
  ])('rejects active or disguised contents in %s and rolls back the entire batch', async (filename, bytes, mime) => {
    await expect(uploadMedia(root, headers, request([part('good.png'), part(filename, Buffer.from(bytes), mime)])))
      .rejects.toMatchObject({ status: 415 });
    expect(fs.readdirSync(uploads)).toEqual([]);
  });

  it.each(['', '.', '..'])('rejects a missing or directory filename %j', async filename => {
    await expect(uploadMedia(root, headers, request([part(filename)]))).rejects.toMatchObject({ status: 400 });
    expect(fs.readdirSync(uploads)).toEqual([]);
  });

  it('rejects a malformed multipart request and cleans its partial files', async () => {
    await expect(uploadMedia(root, headers, Readable.from([part('good.png')]) as unknown as IncomingMessage)).rejects.toThrow();
    expect(fs.readdirSync(uploads)).toEqual([]);
  });

  it('cleans partial files when the request is interrupted', async () => {
    const stream = new PassThrough();
    const upload = uploadMedia(root, headers, stream as unknown as IncomingMessage);
    const rejected = expect(upload).rejects.toMatchObject({ status: 400 });
    stream.write(part('photo.png'));
    stream.emit('aborted');
    stream.end();
    await rejected;
    expect(fs.readdirSync(uploads)).toEqual([]);
  });

  it('limits batch size and removes files already written in that batch', async () => {
    await expect(uploadMedia(root, headers, request(Array.from({ length: 11 }, () => part('photo.png')))))
      .rejects.toMatchObject({ status: 413 });
    expect(fs.readdirSync(uploads)).toEqual([]);
  });

  it('accepts the supported ten-file batch', async () => {
    const result = await uploadMedia(root, headers, request(Array.from({ length: 10 }, () => part('photo.png'))));
    expect(result.assets).toHaveLength(10);
    expect(fs.readdirSync(uploads)).toHaveLength(10);
  });

  it('recognizes passive audio and video containers independently of a claimed MIME type', async () => {
    const result = await uploadMedia(root, headers, request([
      part('recording.mp3', Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00'), 'text/html'),
      part('film.mp4', Buffer.from([0, 0, 0, 20, ...Buffer.from('ftypisom'), 0, 0, 0, 0, ...Buffer.from('isom')]), 'text/html'),
    ]));
    expect(result.assets).toMatchObject([{ type: 'audio', name: 'recording.mp3' }, { type: 'video', name: 'film.mp4' }]);
    expect(result.urls[0]).toMatch(/\.mp3$/);
    expect(result.urls[1]).toMatch(/\.mp4$/);
  });

  it('returns a useful 415 response through the authenticated HTTP upload endpoint', async () => {
    const app = express();
    app.use('/api', createAdminApi(root, { ADMIN_PASSWORD: 'fixture-password' }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const login = await fetch(`${origin}/api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'fixture-password' }),
      });
      const { token } = await login.json();
      const body = new FormData();
      body.append('file', new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/svg+xml' }), 'image.svg');
      const response = await fetch(`${origin}/api/upload-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body,
      });
      expect(response.status).toBe(415);
      expect(await response.json()).toEqual({ error: 'Unsupported media format' });
      expect(fs.readdirSync(uploads)).toEqual([]);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });

  it('limits individual file bytes and removes the truncated upload', async () => {
    const megabyte = Buffer.alloc(1024 * 1024);
    const stream = Readable.from((async function* () {
      yield part('large.png', png).subarray(0, -2);
      for (let index = 0; index < 101; index++) yield megabyte;
      yield Buffer.concat([Buffer.from('\r\n'), end]);
    })());
    await expect(uploadMedia(root, headers, stream as unknown as IncomingMessage)).rejects.toMatchObject({ status: 413 });
    expect(fs.readdirSync(uploads)).toEqual([]);
  });
});
