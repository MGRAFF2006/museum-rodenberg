// @vitest-environment node
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { afterEach, beforeEach, expect, it } from 'vitest';
// @ts-expect-error JavaScript server helper has no client-facing contract.
import { serveMuseumFiles } from '../../server/static-files.js';

let root: string;
let server: Server;
let origin: string;
beforeEach(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-static-'));
  for (const dir of ['dist/uploads', 'dist/assets', 'public/uploads']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  fs.writeFileSync(path.join(root, 'dist/index.html'), '<html>Museum shell</html>');
  fs.writeFileSync(path.join(root, 'dist/assets/app-123.js'), 'asset');
  fs.writeFileSync(path.join(root, 'dist/uploads/seed.jpg'), 'old build bytes');
  fs.writeFileSync(path.join(root, 'public/uploads/seed.jpg'), 'live bytes');
  const app = express();
  serveMuseumFiles(app, root);
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test port');
  origin = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  fs.rmSync(root, { recursive: true, force: true });
});

it('serves current persistent bytes and never resurrects a deleted build copy', async () => {
  const current = await fetch(`${origin}/uploads/seed.jpg`);
  expect(current.headers.get('content-security-policy')).toBe('sandbox');
  expect(current.headers.get('x-content-type-options')).toBe('nosniff');
  expect(await current.text()).toBe('live bytes');
  fs.unlinkSync(path.join(root, 'public/uploads/seed.jpg'));
  const missing = await fetch(`${origin}/uploads/seed.jpg`);
  expect(missing.status).toBe(404);
  expect(missing.headers.get('cache-control')).toBe('no-store');
});
it.each(['/api/unknown', '/convex', '/uploads/missing.png'])('returns a noncacheable 404 for %s', async (url) => {
  const response = await fetch(origin + url);
  expect(response.status).toBe(404);
  expect(response.headers.get('content-type')).toMatch('application/json');
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it.each(['/', '/index.html', '/exhibitions/example'])('does not cache the HTML entry at %s', async (url) => {
  const response = await fetch(origin + url);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.text()).toContain('Museum shell');
});
it('retains immutable caching for hashed build assets', async () => {
  expect((await fetch(`${origin}/assets/app-123.js`)).headers.get('cache-control')).toContain('immutable');
});
