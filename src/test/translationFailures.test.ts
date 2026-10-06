// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { translate } from '../../server/api-handlers.js';
import { translateText } from '../utils/translationUtils';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('sessionStorage', { getItem: () => null, removeItem: vi.fn() });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const stalledFetch = () => vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
  init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
}));

it('aborts a stalled upstream request after 20 seconds and clears its timer', async () => {
  const fetch = stalledFetch();
  vi.stubGlobal('fetch', fetch);
  const pending = translate({ text: 'Server timeout', target: 'en' }, 'http://translation.test', undefined);
  await vi.advanceTimersByTimeAsync(20_000);
  expect(await pending).toMatchObject({ status: 504, body: { retryable: true } });
  expect(fetch.mock.calls[0][1].signal!.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps the timeout active while reading a stalled upstream JSON body', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })),
  })));
  const pending = translate({ text: 'Body timeout', target: 'en' }, 'http://translation.test', undefined);
  await vi.advanceTimersByTimeAsync(20_000);
  expect(await pending).toMatchObject({ status: 504 });
  expect(vi.getTimerCount()).toBe(0);
});

it('classifies upstream credential/configuration failures without echoing provider error bodies', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'synthetic-sensitive-provider-detail' }, { status: 403 })));
  const result = await translate({ text: 'Provider error', target: 'en' }, 'http://translation.test', 'synthetic-api-key');
  expect(result).toMatchObject({ status: 502, body: { retryable: false } });
  expect(JSON.stringify(result)).not.toContain('synthetic-sensitive-provider-detail');
  expect(JSON.stringify(result)).not.toContain('synthetic-api-key');
  expect(vi.getTimerCount()).toBe(0);
});

it('rejects invalid inputs and configuration before issuing a request', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  expect(await translate({ text: 42, target: 'en' }, 'http://translation.test', undefined)).toMatchObject({ status: 400 });
  expect(await translate({ text: 'text', target: 'en' }, 'not a URL', undefined)).toMatchObject({ status: 503, body: { retryable: false } });
  expect(fetch).not.toHaveBeenCalled();
});

it.each([400, 401, 403, 404])('does not retry permanent client HTTP %i failures', async status => {
  const fetch = vi.fn(async () => Response.json({ error: 'Permanent failure' }, { status }));
  vi.stubGlobal('fetch', fetch);
  await expect(translateText(`Permanent ${status}`, 'en')).rejects.toThrow('Permanent failure');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('honors a non-retryable upstream classification even when the API returns 502', async () => {
  const fetch = vi.fn(async () => Response.json({ error: 'Bad provider key', retryable: false }, { status: 502 }));
  vi.stubGlobal('fetch', fetch);
  await expect(translateText('Upstream permanent', 'en')).rejects.toThrow('Bad provider key');
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('retries a transient rate limit and caches only a valid successful translation', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ error: 'Busy' }, { status: 429 }))
    .mockResolvedValueOnce(Response.json({ translatedText: 'Translated' }));
  vi.stubGlobal('fetch', fetch);
  const pending = translateText('Transient rate limit', 'en');
  await vi.runAllTimersAsync();
  expect(await pending).toBe('Translated');
  expect(await translateText('Transient rate limit', 'en')).toBe('Translated');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

it('bounds repeated network failures to three attempts', async () => {
  const fetch = vi.fn(async () => { throw new TypeError('Network offline'); });
  vi.stubGlobal('fetch', fetch);
  const rejected = expect(translateText('Network failures', 'en')).rejects.toThrow('Network offline');
  await vi.runAllTimersAsync();
  await rejected;
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(vi.getTimerCount()).toBe(0);
});

it('bounds client-side stalled requests and aborts all three attempts', async () => {
  const fetch = stalledFetch();
  vi.stubGlobal('fetch', fetch);
  const rejected = expect(translateText('Client stalled', 'en')).rejects.toThrow('Aborted');
  await vi.runAllTimersAsync();
  await rejected;
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls.every(([, init]) => init.signal!.aborted)).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it('does not cache or retry an invalid successful response', async () => {
  const fetch = vi.fn(async () => Response.json({ translatedText: null }));
  vi.stubGlobal('fetch', fetch);
  await expect(translateText('Invalid response', 'en')).rejects.toThrow('Invalid translation response');
  await expect(translateText('Invalid response', 'en')).rejects.toThrow('Invalid translation response');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
