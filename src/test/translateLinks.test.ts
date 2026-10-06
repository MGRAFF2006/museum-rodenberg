// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { translate } from '../../server/api-handlers.js';

afterEach(() => vi.unstubAllGlobals());
const echo = () => vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
  const { q } = JSON.parse(init.body as string);
  return Response.json({ translatedText: q });
}));

it('preserves eleven distinct URLs without index-prefix substitutions', async () => {
  echo();
  const text = Array.from({ length: 11 }, (_, index) => `[${index}](https://example.test/${String.fromCharCode(97 + index)})`).join(' ');
  expect((await translate({ text, target: 'en' }, 'http://translation.test', undefined)).body).toEqual({ translatedText: text });
});

it('restores dollar replacement tokens as literal URL bytes', async () => {
  echo();
  const text = "[link](https://example.test/$&/$$/$`/$'/path)";
  expect((await translate({ text, target: 'fr' }, 'http://translation.test', undefined)).body).toEqual({ translatedText: text });
});

it('preserves link separators, paragraph boundaries, and literal old placeholder prose', async () => {
  echo();
  const text = 'ASSETURL0 is a label.\n\n[First](https://example.test/a)  [Second](https://example.test/b)\n\n![Picture](https://example.test/photo.png)';
  expect((await translate({ text, target: 'pl' }, 'http://translation.test', undefined)).body).toEqual({ translatedText: text });
});

it('fails rather than returning corrupted links if the service alters an opaque placeholder', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ translatedText: '[link](altered)' })));
  await expect(translate({ text: '[link](https://example.test/a)', target: 'en' }, 'http://translation.test', undefined))
    .rejects.toThrow('did not preserve protected links');
});
