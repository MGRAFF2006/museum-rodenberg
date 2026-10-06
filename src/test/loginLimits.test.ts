// @vitest-environment node
import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createAdminApi } from '../../server/admin-api.js';

let server: Server;
let url: string;
beforeEach(async () => {
  const app = express();
  app.use('/api', createAdminApi(process.cwd(), { ADMIN_PASSWORD: 'fixture-password' }));
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test port');
  url = `http://127.0.0.1:${address.port}/api/login`;
});
afterEach(async () => {
  vi.restoreAllMocks();
  await new Promise<void>(resolve => server.close(() => resolve()));
});
const login = (password = 'wrong', forwarded = '') => fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': forwarded },
  body: JSON.stringify({ password }),
});
it('bounds failures, ignores forged forwarded addresses, and recovers after the window', async () => {
  const now = Date.now();
  vi.spyOn(Date, 'now').mockReturnValue(now);
  for (let i = 0; i < 10; i++) expect((await login('wrong', `192.0.2.${i}`)).status).toBe(401);
  const blocked = await login('fixture-password');
  expect(blocked.status).toBe(429);
  expect(blocked.headers.get('retry-after')).toBe('900');
  vi.mocked(Date.now).mockReturnValue(now + 15 * 60 * 1000);
  const recovered = await login('fixture-password');
  expect(recovered.status).toBe(200);
  expect((await recovered.json()).token).toMatch(/^[a-f0-9]{64}$/);
});
it('successful authentication clears the failure bucket', async () => {
  for (let batch = 0; batch < 2; batch++) {
    for (let i = 0; i < 9; i++) expect((await login()).status).toBe(401);
    expect((await login('fixture-password')).status).toBe(200);
  }
});
