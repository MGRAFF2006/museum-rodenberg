import { afterEach, expect, it, vi } from 'vitest';
import { translateText } from '../translationUtils';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it.each([400, 401, 403, 404, 422])('does not retry permanent HTTP %i failures', async (status) => {
  const fetcher = vi.fn(async () => new Response('{}', { status }));
  vi.stubGlobal('fetch', fetcher);
  await expect(translateText(`fixture-${status}`, 'en')).rejects.toThrow(`Translation failed: ${status}`);
  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0]).toHaveLength(2);
});
it.each([408, 429, 503])('retries a transient HTTP %i failure and then succeeds', async (status) => {
  vi.useFakeTimers();
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('{}', { status })).mockResolvedValueOnce(new Response(JSON.stringify({ translatedText: 'translated' })));
  vi.stubGlobal('fetch', fetcher);
  const result = translateText(`transient-${status}`, 'en');
  await vi.runAllTimersAsync();
  await expect(result).resolves.toBe('translated');
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('passes a finite deadline to browser translation requests', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  const fetcher = vi.fn(async (_url, options: RequestInit) => {
    expect(options.signal).toBeInstanceOf(AbortSignal);
    return new Response(JSON.stringify({ translatedText: 'bounded' }));
  });
  vi.stubGlobal('fetch', fetcher);
  await expect(translateText('deadline-fixture', 'en')).resolves.toBe('bounded');
  expect(timeout).toHaveBeenCalledWith(35_000);
});
