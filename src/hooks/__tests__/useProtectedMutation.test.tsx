import { afterEach, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { api } from '../../../convex/_generated/api';
import { useProtectedMutation } from '../useProtectedMutation';
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
