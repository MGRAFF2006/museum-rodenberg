// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { translate } from '../../server/api-handlers.js';
afterEach(() => vi.unstubAllGlobals());
function translator(transform = (text: string) => text) {
  const fetcher = vi.fn(async (_url: unknown, options: RequestInit) => {
    const { q } = JSON.parse(options.body as string);
    return new Response(JSON.stringify({ translatedText: transform(q) }));
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
it('preserves eleven destinations including literal replacement-string syntax', async () => {
  translator();
  const text = Array.from({ length: 11 }, (_, i) => `[${i}](https://example.org/${i}?a=$&$1$\`)`).join(' ');
  expect((await translate({ text, target: 'en' }, 'http://translator.test', undefined)).body).toEqual({ translatedText: text });
});
it('preserves paragraph and prose separators around links and images', async () => {
  translator();
  const text = 'Before [link](https://example.org/a).\n\n![image](/uploads/example.jpg)\n\nAfter';
  expect((await translate({ text, target: 'en' }, 'http://translator.test', undefined)).body).toEqual({ translatedText: text });
});
it('recovers spaced, case-modified placeholder text without disturbing destinations', async () => {
  translator(text => text.replace('ASSETURL0', 'asset URL 0'));
  expect((await translate({ text: '[link](audio:bell)', target: 'en' }, 'http://translator.test', undefined)).body).toEqual({ translatedText: '[link](audio:bell)' });
});
it('rejects invalid types and languages before a translator request', async () => {
  const fetcher = translator();
  for (const body of [{ text: {}, target: 'en' }, { text: 'hello', target: {} }, { text: 'hello', target: 'xx' }]) {
    expect((await translate(body, 'http://translator.test', undefined)).status).toBe(400);
  }
  expect(fetcher).not.toHaveBeenCalled();
});
it('rejects invalid translator output', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => {
    return new Response(JSON.stringify({ translatedText: null }));
  }));
  await expect(translate({ text: 'hi', target: 'en' }, 'http://translator.test', undefined)).rejects.toThrow('Invalid translation response');
});
