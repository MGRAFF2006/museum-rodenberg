// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { translate } from '../../server/api-handlers.js';
import { translateText } from '../utils/translationUtils';

beforeEach(() => {
  vi.stubGlobal('sessionStorage', { getItem: () => null, removeItem: vi.fn() });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it.each([400, 401, 403, 404, 422])('does not retry a provider HTTP %i failure through the proxy/client boundary', async status => {
  const provider = vi.fn(async () => Response.json({ error: 'synthetic-private-provider-detail' }, { status }));
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    if (url === 'http://translator.test') return provider();
    const result = await translate(JSON.parse(init.body as string), 'http://translator.test', undefined);
    expect(result).toEqual({ status: 502, body: { error: 'Translation service rejected the request', retryable: false } });
    expect(JSON.stringify(result)).not.toContain('synthetic-private-provider-detail');
    return Response.json(result.body, { status: result.status });
  });
  vi.stubGlobal('fetch', fetcher);
  await expect(translateText(`provider-permanent-${status}`, 'en')).rejects.toThrow('Translation failed: 502');
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(provider).toHaveBeenCalledOnce();
  expect(sessionStorage.removeItem).not.toHaveBeenCalled();
});

it.each(['not a URL', 'file:///fixture', 'ftp://translator.test'])('does not request or retry invalid provider configuration %s', async apiUrl => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  expect(await translate({ text: 'hello', target: 'en' }, apiUrl, undefined)).toEqual({ status: 503, body: { error: 'Translation service is not configured', retryable: false } });
  expect(fetcher).not.toHaveBeenCalled();
});

it.each([408, 429, 503])('preserves transient provider HTTP %i classification through the proxy/client boundary', async status => {
  vi.useFakeTimers();
  let attempts = 0;
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    if (url === 'http://translator.test') {
      attempts++;
      return attempts === 1 ? Response.json({}, { status }) : Response.json({ translatedText: 'recovered translation' });
    }
    const result = await translate(JSON.parse(init.body as string), 'http://translator.test', undefined);
    return Response.json(result.body, { status: result.status });
  });
  vi.stubGlobal('fetch', fetcher);
  const pending = translateText(`provider-transient-${status}`, 'en');
  await vi.runAllTimersAsync();
  expect(await pending).toBe('recovered translation');
  expect(attempts).toBe(2);
});

it.each([null, {}, { translatedText: null }, { translatedText: '' }, { translatedText: '  ' }, { translatedText: 42 }])('rejects malformed provider success without retrying or caching %#', async data => {
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    if (url === 'http://translator.test') return Response.json(data);
    const result = await translate(JSON.parse(init.body as string), 'http://translator.test', undefined);
    expect(result).toMatchObject({ status: 502, body: { retryable: false } });
    return Response.json(result.body, { status: result.status });
  });
  vi.stubGlobal('fetch', fetcher);
  const text = `malformed-provider-${JSON.stringify(data)}`;
  await expect(translateText(text, 'en')).rejects.toThrow('Translation failed: 502');
  await expect(translateText(text, 'en')).rejects.toThrow('Translation failed: 502');
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it('rejects malformed provider JSON as a permanent response failure', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{ broken JSON')));
  expect(await translate({ text: 'hi', target: 'en' }, 'http://translator.test', undefined)).toEqual({ status: 502, body: { error: 'Invalid translation response', retryable: false } });
});

it('rejects malformed successful API JSON without retrying or caching it', async () => {
  const fetcher = vi.fn(async () => new Response('{ broken JSON'));
  vi.stubGlobal('fetch', fetcher);
  await expect(translateText('malformed-api-json', 'en')).rejects.toThrow('Invalid translation response');
  await expect(translateText('malformed-api-json', 'en')).rejects.toThrow('Invalid translation response');
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('keeps editor authentication failures permanent even when a body says retryable', async () => {
  const fetcher = vi.fn(async () => Response.json({ retryable: true }, { status: 401 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(translateText('api-auth-error-hint', 'en')).rejects.toThrow('Translation failed: 401');
  expect(fetcher).toHaveBeenCalledOnce();
});

it('keeps the server deadline active while reading the provider body', async () => {
  const controller = new AbortController();
  vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  let reading = false;
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => {
      reading = true;
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }),
  })));
  const pending = translate({ text: 'body deadline', target: 'en' }, 'http://translator.test', undefined);
  while (!reading) await Promise.resolve();
  controller.abort();
  expect(await pending).toMatchObject({ status: 504, body: { retryable: true } });
});
