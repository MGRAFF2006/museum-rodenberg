// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, upgradeConvex } from '../../server/app.js';

describe('production server', () => {
  let rootDir: string;
  let origin: string;
  let server: http.Server;
  let backend: http.Server;
  let backendRequests: Array<{ url: string; authorization?: string; body: string }>;

  beforeEach(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-server-'));
    fs.mkdirSync(path.join(rootDir, 'dist/uploads'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'public/uploads'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'dist/index.html'), '<h1>Museum</h1>');
    fs.writeFileSync(path.join(rootDir, 'dist/sw.js'), '// worker');
    fs.writeFileSync(path.join(rootDir, 'dist/uploads/photo.jpg'), 'stale seed');
    fs.writeFileSync(path.join(rootDir, 'public/uploads/photo.jpg'), 'live upload');
    backendRequests = [];
    backend = http.createServer(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      backendRequests.push({ url: req.url!, authorization: req.headers.authorization, body });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'success', value: 'saved' }));
    });
    await new Promise<void>(resolve => backend.listen(0, '127.0.0.1', resolve));
    const backendPort = (backend.address() as import('node:net').AddressInfo).port;
    const { app, convexProxy } = createApp({ rootDir, env: {
      ADMIN_PASSWORD: 'test-password', CONVEX_BACKEND_URL: `http://127.0.0.1:${backendPort}`,
      CONVEX_SELF_HOSTED_ADMIN_KEY: 'test-deployment-key',
    } });
    server = http.createServer(app);
    server.on('upgrade', (req, socket, head) => upgradeConvex(convexProxy, req, socket, head));
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
  });

  afterEach(async () => {
    await Promise.all([server, backend].map(s => new Promise<void>(resolve => s.close(() => resolve()))));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  const jsonRequest = (body: unknown, token?: string): RequestInit => ({
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

  it('requires a valid session for content writes and revokes it on logout', async () => {
    const operation = { name: 'exhibitions:save', args: { slug: 'sample' } };
    expect((await fetch(`${origin}/api/admin/mutation`, jsonRequest(operation))).status).toBe(401);
    expect(backendRequests).toHaveLength(0);
    const login = await fetch(`${origin}/api/login`, jsonRequest({ password: 'test-password' }));
    const { token } = await login.json();
    expect((await fetch(`${origin}/api/admin/mutation`, jsonRequest({ name: 'migrate:run', args: {} }, token))).status).toBe(400);
    const response = await fetch(`${origin}/api/admin/mutation`, jsonRequest(operation, token));
    expect(await response.json()).toEqual({ value: 'saved' });
    expect(backendRequests[0].authorization).toBe('Convex test-deployment-key');
    expect(JSON.parse(backendRequests[0].body).path).toBe('exhibitions:save');
    await fetch(`${origin}/api/logout`, jsonRequest({}, token));
    expect((await fetch(`${origin}/api/admin/mutation`, jsonRequest(operation, token))).status).toBe(401);
  });

  it('limits failed login attempts', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await fetch(`${origin}/api/login`, jsonRequest({ password: 'wrong' }))).status).toBe(401);
    }
    expect((await fetch(`${origin}/api/login`, jsonRequest({ password: 'wrong' }))).status).toBe(429);
  });

  it('proxies Convex HTTP paths without the mount prefix', async () => {
    expect((await fetch(`${origin}/convex/version`)).status).toBe(200);
    expect(backendRequests[0].url).toBe('/version');
  });

  it('serves current uploads, keeps missing media out of SPA fallback, and revalidates the app shell', async () => {
    expect(await (await fetch(`${origin}/uploads/photo.jpg`)).text()).toBe('live upload');
    fs.unlinkSync(path.join(rootDir, 'public/uploads/photo.jpg'));
    expect((await fetch(`${origin}/uploads/photo.jpg`)).status).toBe(404);
    const missing = await fetch(`${origin}/api/missing`);
    expect(missing.status).toBe(404);
    expect(missing.headers.get('content-type')).toContain('application/json');
    expect((await fetch(origin)).headers.get('cache-control')).toContain('no-store');
    expect((await fetch(`${origin}/index.html`)).headers.get('cache-control')).toBe('no-cache');
    expect((await fetch(`${origin}/sw.js`)).headers.get('cache-control')).toBe('no-cache');
  });

  it('waits for uploaded files, uses unique names and rejects active content', async () => {
    const { token } = await (await fetch(`${origin}/api/login`, jsonRequest({ password: 'test-password' }))).json();
    const upload = async (type: string) => {
      const form = new FormData();
      form.append('file', new Blob(['media bytes'], { type }), 'photo.jpg');
      return fetch(`${origin}/api/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    };
    const first = await (await upload('image/jpeg')).json();
    const second = await (await upload('image/jpeg')).json();
    expect(first.url).not.toBe(second.url);
    expect(fs.readFileSync(path.join(rootDir, 'public', first.url), 'utf8')).toBe('media bytes');
    const invalid = await upload('text/html');
    expect(invalid.status).toBe(415);
    expect(fs.readdirSync(path.join(rootDir, 'public/uploads'))).toHaveLength(3);
  });
});
