// @vitest-environment node
import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createAdminApi } from '../../server/admin-api.js';
import { uploadMedia } from '../../server/api-handlers.js';
vi.mock('../../server/api-handlers.js', async importOriginal => ({ ...await importOriginal<object>(), uploadMedia: vi.fn() }));
let server: Server;
let origin: string;
let token: string;
beforeEach(async () => {
  const app = express();
  app.use('/api', createAdminApi(process.cwd(), { ADMIN_PASSWORD: 'fixture-password' }));
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('Missing test port');
  origin = `http://127.0.0.1:${addr.port}/api`;
  ({ token } = await (await fetch(origin + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'fixture-password' }) })).json());
});
afterEach(async () => { vi.resetAllMocks(); await new Promise<void>(resolve => server.close(() => resolve())); });
it.each([400, 413, 415])('returns upload validation status %i', async status => {
  vi.mocked(uploadMedia).mockRejectedValue(Object.assign(new Error('Invalid upload fixture'), { status }));
  const response = await fetch(origin + '/upload-media', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error: 'Invalid upload fixture' });
});
it('hides unexpected filesystem diagnostics', async () => {
  vi.mocked(uploadMedia).mockRejectedValue(new Error('fixture-private-server-diagnostic'));
  const response = await fetch(origin + '/upload-media', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('fixture-private');
});
it('reports malformed JSON without echoing body fragments', async () => {
  const response = await fetch(origin + '/content-write', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{"private-fixture":' });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: 'Invalid request body' });
});
it('bounds JSON bodies and reports oversized input', async () => {
  const response = await fetch(origin + '/content-write', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(10 * 1024 * 1024) }) });
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({ error: 'Request body too large' });
});
