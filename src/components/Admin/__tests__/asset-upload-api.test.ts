// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import busboy from 'busboy';
import { createServer } from 'vite';
import { devServerApiPlugin } from '../../../../scripts/dev-server-plugin';
import { uploadMedia } from '../../../../server/api-handlers.js';
import { authFetch, getToken, login } from '../../../utils/auth';

// Keep the actual Vite routes and session checks; parse uploads without writing files.
vi.mock('../../../../server/api-handlers.js', async importOriginal => ({
  ...await importOriginal<typeof import('../../../../server/api-handlers.js')>(),
  uploadMedia: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('accepts multipart uploads with a current Vite login and rejects revoked sessions', async () => {
  vi.stubEnv('ADMIN_PASSWORD', 'fixture-password');
  const storage = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  const fields: string[] = [];
  vi.mocked(uploadMedia).mockImplementation((_root: string, headers: IncomingHttpHeaders, request: IncomingMessage) => new Promise((resolve, reject) => {
    const parser = busboy({ headers });
    parser.on('file', (field, file) => { fields.push(field); file.resume(); });
    parser.on('error', reject);
    parser.on('finish', () => resolve({ urls: ['/uploads/fixture.png'], url: '/uploads/fixture.png', assets: [{ id: 'fixture' }] }));
    request.pipe(parser);
  }));
  const vite = await createServer({
    configFile: false, plugins: [devServerApiPlugin()],
    server: { host: '127.0.0.1', port: 0 },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    await vite.listen();
    const base = `http://127.0.0.1:${(vite.httpServer!.address() as AddressInfo).port}`;
    const nativeFetch = globalThis.fetch;
    vi.stubGlobal('fetch', (path: string, init?: RequestInit) => nativeFetch(base + path, init));
    expect(await login('fixture-password')).toBe(true);
    const token = getToken();
    expect(token).toBeTruthy();
    for (const [endpoint, field] of [['upload-image', 'image'], ['upload-media', 'file']]) {
      const body = new FormData();
      body.append(field, new Blob(['fixture'], { type: 'image/png' }), 'fixture.png');
      const response = await authFetch(`/api/${endpoint}`, { method: 'POST', body });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ assets: [{ id: 'fixture' }] });
    }
    expect(fields).toEqual(['image', 'file']);
    expect(vi.mocked(uploadMedia).mock.calls[0][1].authorization).toBe(`Bearer ${token}`);
    expect(vi.mocked(uploadMedia).mock.calls[0][1]['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    await authFetch('/api/logout', { method: 'POST' });
    expect((await authFetch('/api/upload-image', { method: 'POST' })).status).toBe(401);
    expect(getToken()).toBeNull();
    expect(uploadMedia).toHaveBeenCalledTimes(2);
  } finally { await vite.close(); }
});
