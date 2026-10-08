import { afterEach, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { api } from '../../../convex/_generated/api';
import { ContentConflictError, ContentQRCodeError, useProtectedMutation } from '../useProtectedMutation';
import { getToken, setToken } from '../../utils/auth';

afterEach(() => { sessionStorage.clear(); vi.unstubAllGlobals(); });

it('sends only the browser session to Express and clears rejected sessions', async () => {
  setToken('browser-session');
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 'saved' })));
  vi.stubGlobal('fetch', fetch);
  const { result } = renderHook(() => useProtectedMutation(api.assets.remove));
  expect(await result.current({ assetId: 'fixture' })).toBe('saved');
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('/api/content-write');
  expect(options.headers.get('Authorization')).toBe('Bearer browser-session');
  expect(JSON.parse(options.body)).toEqual({ operation: 'assets:remove', args: { assetId: 'fixture' } });
  fetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));
  await expect(result.current({ assetId: 'fixture' })).rejects.toThrow('log in again');
  expect(getToken()).toBeNull();
});

it('identifies stale writes without treating them as expired sessions', async () => {
  setToken('browser-session');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'STALE_CONTENT' }), { status: 409 })));
  const { result } = renderHook(() => useProtectedMutation(api.artifacts.save));
  await expect(result.current({ slug: 'fixture', qrCode: '', image: '', translations: [] })).rejects.toBeInstanceOf(ContentConflictError);
  expect(getToken()).toBe('browser-session');
});

it('distinguishes QR conflicts from stale drafts and hides response details', async () => {
  setToken('browser-session');
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'QR_CONFLICT', error: 'fixture-private-detail' }), { status: 409 }));
  vi.stubGlobal('fetch', fetch);
  const { result } = renderHook(() => useProtectedMutation(api.artifacts.save));
  const args = { slug: 'fixture', qrCode: 'duplicate', image: '', translations: [] };
  await expect(result.current(args)).rejects.toBeInstanceOf(ContentQRCodeError);
  fetch.mockResolvedValueOnce(new Response('{}', { status: 409 }));
  await expect(result.current(args)).rejects.toThrow('Failed to write content');
  expect(getToken()).toBe('browser-session');
});
