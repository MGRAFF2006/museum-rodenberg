import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import { extractMediaFromMarkdown, stripMarkdown } from '../utils/markdownUtils';
import { getTranslatedContent, splitMarkdown, joinBlocks } from '../utils/translationUtils';
import { protectMarkdownDestinations, restoreMarkdownDestinations, resolveMarkdownAssetReferences } from '../utils/markdownParsing.js';
import { translate } from '../../server/api-handlers.js';

afterEach(() => vi.unstubAllGlobals());
const namespace = 'ab1234567890';
const cases = [
  'Before ![Photo](/uploads/photo(1).jpg) after',
  'Before ![Photo](/uploads/photo\\(1\\).jpg "Optional title") after',
  'Before [**Nested** caption](<https://example.com/path(1)?q=a&b=2> "Title") after',
  'Before [Audio: **Guide**](audio:/uploads/guide(1).mp3) after',
  'Before ![Reference][picture] and [Linked][picture]\n\n[picture]: </uploads/photo(1).jpg> "Title"',
  'Before `![Not media](secret)` after\n\n```markdown\n![Not media](secret)\n```',
  'Before <https://example.com/a(1)> after',
  'Before [![Linked photo](/uploads/photo(1).jpg)](https://example.com/item(1)) after',
  'ASSETURL0 and URL 0 are literal labels. [Photo](/uploads/photo(1).jpg)',
];

describe.each(cases)('CommonMark source preservation: %s', (source) => {
  it('round-trips exact whitespace and syntax through protection and splitting', () => {
    const protectedSource = protectMarkdownDestinations(source, namespace);
    expect(restoreMarkdownDestinations(protectedSource.text, protectedSource.destinations, namespace)).toBe(source);
    expect(joinBlocks(splitMarkdown(source))).toBe(source);
  });

  it('round-trips through the actual server translation adapter without exposing URLs/code', async () => {
    let sent = '';
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => {
      sent = JSON.parse(options.body as string).q;
      return new Response(JSON.stringify({ translatedText: sent.split('/uploads/').join('/corrupted/').split('secret').join('corrupted') }));
    }));
    const result = await translate({ text: source, target: 'en' }, 'http://translator.invalid', undefined);
    expect(result.body).toEqual({ translatedText: source });
    expect(sent).not.toContain('/uploads/');
    expect(sent).not.toContain('secret');
  });
});

it('extracts balanced, escaped and reference image URLs while ignoring code samples', () => {
  const markdown = '![First](/a(1).jpg) ![Second](/b\\(2\\).jpg) ![Third][id]\n\n[id]: /c(3).jpg\n\n`![Fake](/fake.jpg)`\n\n```\n![Fake](/fake2.jpg)\n```';
  expect(extractMediaFromMarkdown(markdown).images).toEqual(['/a(1).jpg', '/b(2).jpg', '/c(3).jpg']);
});

it('extracts custom media with nested formatting and keeps full URLs', () => {
  const result = extractMediaFromMarkdown('[Audio: **Guide**](audio:/guide(1).mp3?version=2)\n\n[Video: Clip](video:/clip(2).webm#start)');
  expect(result.audio).toEqual([{ url: '/guide(1).mp3?version=2', title: 'Guide' }]);
  expect(result.videos).toEqual([{ url: '/clip(2).webm#start', title: 'Clip' }]);
});

it('resolves complete asset IDs and preserves captions, titles, reference syntax and code', () => {
  const asset = { url: '/uploads/photo(1).jpg?x=1&copy=2', alt: 'A [caption]' };
  const source = '![Photo](asset(1) "Title") ![][id]\n\n[id]: <asset(1)>\n\n`![Fake](asset(1))`';
  const resolved = resolveMarkdownAssetReferences(source, id => id === 'asset(1)' ? asset : undefined);
  render(<ReactMarkdown>{resolved}</ReactMarkdown>);
  expect(screen.getByAltText('Photo')).toHaveAttribute('src', asset.url);
  expect(screen.getByAltText('Photo')).toHaveAttribute('title', 'Title');
  expect(screen.getByAltText('A [caption]')).toHaveAttribute('src', asset.url);
  expect(resolved).toContain('`![Fake](asset(1))`');
  expect(resolved).toContain('[id]: <');
});

it('resolves description and detailed content through the application converter', () => {
  const source = '![Photo](asset(1))';
  const result = getTranslatedContent({ translations: { de: { title: 'Title', description: source } }, detailedContent: { de: source } }, 'de', 'de', id => id === 'asset(1)' ? { url: '/resolved.jpg', alt: 'Alt' } : undefined);
  expect(result.description).toBe('![Photo](/resolved.jpg)');
  expect(result.detailedContent?.de).toBe('![Photo](/resolved.jpg)');
});

it('does not leave parenthetical URL fragments in narrated plain text', () => {
  expect(stripMarkdown('See ![Photo](/a(1).jpg) and [caption](https://example.com/page(1)).')).toBe('See Photo and caption.');
});

it.each(['a &copy; b', 'a\n\nb', 'a\r\nb'])('preserves literal metadata caption %j in an image node', (alt) => {
  const resolved = resolveMarkdownAssetReferences('![](asset)', id => id === 'asset' ? { url: '/photo.png', alt } : undefined);
  render(<ReactMarkdown>{resolved}</ReactMarkdown>);
  expect(screen.getByRole('img')).toHaveAttribute('src', '/photo.png');
  expect(screen.getByRole('img')).toHaveAttribute('alt', alt);
});
