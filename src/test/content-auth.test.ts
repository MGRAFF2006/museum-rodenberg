// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ConvexHttpClient } from 'convex/browser';
import { getFunctionName } from 'convex/server';
import { createAdminApi } from '../../server/admin-api.js';
import * as artifacts from '../../convex/artifacts';
import * as assets from '../../convex/assets';
import * as exhibitions from '../../convex/exhibitions';
import { createServer as createViteServer } from 'vite';
import { devServerApiPlugin } from '../../scripts/dev-server-plugin';

const credential = 'fixture-server-credential';
const writes = [
  artifacts.save, artifacts.remove, assets.save, assets.remove,
  exhibitions.save, exhibitions.remove, exhibitions.setFeatured,
];
const servers: Server[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
    server.closeAllConnections();
    server.close(() => resolve());
  })));
});

async function serve(mode: 'express' | 'vite', configured = true) {
  const api = createAdminApi(process.cwd(), {
    ADMIN_PASSWORD: 'fixture-password',
    CONVEX_BACKEND_URL: 'http://127.0.0.1:3210',
    CONVEX_WRITE_SECRET: configured ? credential : undefined,
  });
  const app = express();
  if (mode === 'express') app.use('/api', api);
  // Connect strips the mount prefix before invoking the Express sub-application.
  const server = createServer(mode === 'express' ? app : (req, res) => {
    req.url = req.url?.replace(/^\/api/, '');
    api(req, res, () => { res.statusCode = 404; res.end(); });
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  return async (route: string, body: unknown = {}, token?: string) => fetch(base + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

describe('Convex content authorization', () => {
  it('rejects every anonymous, wrong-credential and unconfigured write before DB access', async () => {
    const query = vi.fn(() => { throw new Error('DB accessed'); });
    for (const write of writes) {
      const handler = (write as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
      for (const expected of [credential, '']) {
        vi.stubEnv('CONVEX_WRITE_SECRET', expected);
        for (const secret of [undefined, '', 'arbitrary-session-token', ...(expected ? [] : [credential])]) {
          await expect(handler({ db: { query } }, { serverSecret: secret })).rejects.toThrow('authorization required');
        }
      }
    }
    expect(query).not.toHaveBeenCalled();
  });

  it('permits every authorized mutation and never persists the credential', async () => {
    vi.stubEnv('CONVEX_WRITE_SECRET', credential);
    const insert = vi.fn(async () => 'fixture-id');
    const patch = vi.fn(async () => undefined);
    const del = vi.fn(async () => undefined);
    const row = { _id: 'existing-id', slug: 'fixture', artifactSlugs: [], value: 'fixture' };
    const chain = { withIndex: () => chain, first: async () => row, collect: async () => [] };
    const ctx = { db: { query: () => chain, insert, patch, delete: del } };
    for (const write of writes) {
      const handler = (write as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
      await handler(ctx, { serverSecret: credential, slug: 'fixture', assetId: 'fixture',
        translations: [{ language: 'de', title: 'Fixture', description: '' }], isFeatured: true });
    }
    expect(patch).toHaveBeenCalled();
    expect(del).toHaveBeenCalled();
    expect(JSON.stringify([...insert.mock.calls, ...patch.mock.calls])).not.toContain(credential);
  });

  it('keeps visitor queries usable without a credential', async () => {
    vi.stubEnv('CONVEX_WRITE_SECRET', '');
    const chain = { withIndex: () => chain, first: async () => null, collect: async () => [] };
    for (const query of [artifacts.list, artifacts.listForLanguage, artifacts.getBySlug, artifacts.getByExhibition,
      assets.list, assets.getByAssetId, exhibitions.list, exhibitions.listForLanguage, exhibitions.getBySlug, exhibitions.getFeatured]) {
      const handler = (query as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
      await handler({ db: { query: () => chain } }, { language: 'de', slug: 'fixture' });
    }
  });
});

for (const mode of ['express', 'vite'] as const) {
  it(`${mode}: authenticates, expires and revokes sessions; allowlists writes and hides server errors`, async () => {
    const mutation = vi.spyOn(ConvexHttpClient.prototype, 'mutation').mockResolvedValue('saved');
    const request = await serve(mode);
    const body = { operation: 'assets:save', args: { assetId: 'fixture', serverSecret: 'browser-forgery' } };
    expect((await request('/login', { password: 'wrong' })).status).toBe(401);
    for (const token of [undefined, 'dev-token', 'invented-token']) {
      expect((await request('/content-write', body, token)).status).toBe(401);
    }
    expect(mutation).not.toHaveBeenCalled();
    const { token } = await (await request('/login', { password: 'fixture-password' })).json();
    expect((await request('/content-write', body, token)).status).toBe(200);
    for (const operation of ['artifacts:save', 'artifacts:remove', 'assets:save', 'assets:remove',
      'exhibitions:save', 'exhibitions:remove', 'exhibitions:setFeatured']) {
      expect((await request('/content-write', { operation, args: {} }, token)).status).toBe(200);
    }
    const call = mutation.mock.calls[0];
    expect(getFunctionName(call[0])).toBe('assets:save');
    expect(call[1]).toEqual({ assetId: 'fixture', serverSecret: credential });
    expect((await request('/content-write', { operation: 'migrate:run', args: {} }, token)).status).toBe(400);
    mutation.mockRejectedValueOnce(new Error(credential));
    const failed = await request('/content-write', body, token);
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain(credential);
    await request('/logout', {}, token);
    expect((await request('/content-write', body, token)).status).toBe(401);
    const loggedIn = await (await request('/login', { password: 'fixture-password' })).json();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 24 * 60 * 60 * 1000);
    expect((await request('/content-write', body, loggedIn.token)).status).toBe(401);
  });
}

it('fails closed when Express write credentials are missing', async () => {
  const mutation = vi.spyOn(ConvexHttpClient.prototype, 'mutation').mockResolvedValue('saved');
  const request = await serve('express', false);
  const { token } = await (await request('/login', { password: 'fixture-password' })).json();
  expect((await request('/content-write', { operation: 'assets:save', args: {} }, token)).status).toBe(503);
  expect(mutation).not.toHaveBeenCalled();
});

it('runs the real Vite API plugin with protected content writes', async () => {
  vi.stubEnv('ADMIN_PASSWORD', 'fixture-password');
  vi.stubEnv('CONVEX_BACKEND_URL', 'http://127.0.0.1:3210');
  vi.stubEnv('CONVEX_WRITE_SECRET', credential);
  const mutation = vi.spyOn(ConvexHttpClient.prototype, 'mutation').mockResolvedValue('saved');
  const vite = await createViteServer({
    configFile: false, plugins: [devServerApiPlugin()],
    server: { host: '127.0.0.1', port: 0 },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    await vite.listen();
    const base = `http://127.0.0.1:${(vite.httpServer!.address() as AddressInfo).port}/api`;
    const post = (route: string, body: unknown, token?: string) => fetch(base + route, {
      method: 'POST', body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const body = { operation: 'assets:remove', args: { assetId: 'fixture' } };
    expect((await post('/content-write', body, 'dev-token')).status).toBe(401);
    expect((await post('/upload-media', {})).status).toBe(401);
    const { token } = await (await post('/login', { password: 'fixture-password' })).json();
    expect((await post('/content-write', body, token)).status).toBe(200);
    expect(mutation).toHaveBeenCalledOnce();
    await post('/logout', {}, token);
    expect((await post('/content-write', body, token)).status).toBe(401);
  } finally { await vite.close(); }
});
