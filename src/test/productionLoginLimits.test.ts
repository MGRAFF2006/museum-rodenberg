// @vitest-environment node
import express, { type Express } from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, expect, it, vi } from 'vitest';

let server: Server | undefined;
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
  }
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('runs production login throttling before body parsing while other API bodies still parse', async () => {
  vi.stubEnv('ADMIN_PASSWORD', 'fixture-password');
  vi.stubEnv('CONVEX_BACKEND_URL', '');
  vi.stubEnv('CONVEX_SELF_HOSTED_URL', '');
  vi.stubEnv('CONVEX_WRITE_SECRET', '');
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const listen = express.application.listen;
  // Execute the real production entry point, replacing only its port/bind address.
  vi.spyOn(express.application, 'listen').mockImplementation(function (this: Express) {
    server = listen.bind(this)(0, '127.0.0.1');
    return server;
  });
  await import(new URL('../../server/index.js', import.meta.url).href);
  if (!server) throw new Error('Production entry point did not start a server');
  if (!server.listening) await new Promise<void>(resolve => server!.once('listening', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const post = (route: string, body: string, token?: string) => fetch(origin + route, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body,
  });
  const login = await post('/login', JSON.stringify({ password: 'fixture-password' }));
  expect(login.status).toBe(200);
  const { token } = await login.json();
  const content = await post('/content-write', JSON.stringify({ operation: 'assets:remove', args: { assetId: 'fixture' } }), token);
  expect(content.status).toBe(503);
  expect(await content.json()).toEqual({ error: 'Content writes are not configured' });
  for (let index = 0; index < 10; index++) {
    expect((await post('/login', JSON.stringify({ password: 'wrong' }))).status).toBe(401);
  }
  const blocked = await post('/login', '{ malformed JSON');
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  expect(await blocked.json()).toEqual({ error: 'Too many login attempts. Try again later.' });
});
