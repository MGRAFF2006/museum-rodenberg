import { afterEach, beforeEach, expect, it, onTestFinished, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

vi.mock('../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
beforeEach(() => { vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

it.each([
  ['image', '/picture.jpg'],
  ['video', '/film.webm'],
  ['audio', '/guide.mp3'],
])('keeps %s media and its caption outside paragraphs', (_type, url) => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = render(<MarkdownRenderer content={`Before *![Museum caption](${url})* after.\n\nOrdinary **paragraph**.`} />);
  expect(container.querySelector('p div, p p, p h4, em div')).toBeNull();
  expect(container.querySelector('p')?.textContent).toBe('Before ');
  expect(screen.getByText('Ordinary', { exact: false }).closest('p')).toHaveTextContent('Ordinary paragraph.');
  expect(screen.getByText('Museum caption')).toBeInTheDocument();
  expect(errors.mock.calls.filter((call) => String(call[0]).includes('validateDOMNesting'))).toEqual([]);
});

it('preserves inline formatting, linked images and gallery activation', () => {
  const onMediaClick = vi.fn();
  const { container } = render(<MarkdownRenderer content="*Before ![Linked picture](/picture.jpg) after* and [![Second](/second.jpg)](https://example.com)." onMediaClick={onMediaClick} />);
  expect(container.querySelectorAll('p em')).toHaveLength(2);
  expect(container.querySelector('p div, em div')).toBeNull();
  fireEvent.click(screen.getByAltText('Linked picture'));
  expect(onMediaClick).toHaveBeenCalledWith('image', '/picture.jpg', 'Linked picture');
  expect(screen.getByAltText('Second').closest('a')).toHaveAttribute('href', 'https://example.com');
});

it('produces server markup that HTML parsing does not restructure around media', () => {
  const html = renderToString(<MarkdownRenderer content="Text ![Caption](/picture.jpg) after." />);
  const parsed = document.createElement('div');
  parsed.innerHTML = html;
  const { container } = render(<MarkdownRenderer content="Text ![Caption](/picture.jpg) after." />);
  expect(parsed.innerHTML).toBe(container.innerHTML);
  expect(parsed.querySelector('p div, p p')).toBeNull();
});


it('hydrates captioned media without DOM nesting or recovery errors', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const recover = vi.fn();
  const view = <MarkdownRenderer content="Before ![Caption](/picture.jpg) after." />;
  const container = document.createElement('div');
  container.innerHTML = renderToString(view);
  document.body.append(container);
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, view, { onRecoverableError: recover }); });
    expect(recover).not.toHaveBeenCalled();
    expect(errors.mock.calls.filter((call) => /validateDOMNesting|hydration/i.test(String(call[0])))).toEqual([]);
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Caption');
  } finally {
    act(() => root?.unmount());
    container.remove();
  }
});

it('keeps a link around text and media as one link with its complete label', () => {
  const { container } = render(<MarkdownRenderer content="Intro [See the ![coat of arms](/arms.jpg) on display](https://example.com) outro." />);
  const links = container.querySelectorAll('a');
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute('href', 'https://example.com');
  expect(links[0].textContent).toMatch(/^See the .* on display$/);
  expect(links[0].querySelector('img')).toHaveAttribute('alt', 'coat of arms');
  expect(container.querySelector('p a, p div')).toBeNull();
});

it('adds no empty paragraph between media that share one formatting span', () => {
  const { container } = render(<MarkdownRenderer content="*![One](/one.jpg) ![Two](/two.jpg)*" />);
  expect(container.querySelectorAll('img')).toHaveLength(2);
  // Only the media captions may render paragraphs; no blank text paragraph between them.
  const textParagraphs = [...container.querySelectorAll('p')].filter((p) => !p.closest('.my-6'));
  expect(textParagraphs).toEqual([]);
});

it('keeps task markers, hard breaks and icon-only gallery buttons next to media', () => {
  const onMediaClick = vi.fn();
  const { container } = render(<MarkdownRenderer
    content={'- [x] ![Flag](/flag.jpg)\n\n- [ ] Next\n\n![One](/one.jpg)\\\n![Two](/two.jpg)\n\n![Flag](/flag.jpg) [](audio:/guide.mp3) ![Stamp](/stamp.jpg)'}
    onMediaClick={onMediaClick}
  />);
  const boxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  expect([...boxes].map((box) => box.checked)).toEqual([true, false]);
  expect(container.querySelector('br')).not.toBeNull();
  fireEvent.click(container.querySelector('button')!);
  expect(onMediaClick).toHaveBeenCalledWith('audio', '/guide.mp3', '');
});

it('keeps emphasis around a lifted media link on its text', () => {
  const { container } = render(<MarkdownRenderer content="**[See ![Flag](/flag.jpg) here](https://example.com)**" />);
  const links = container.querySelectorAll('a');
  expect(links).toHaveLength(1);
  expect([...links[0].querySelectorAll('strong')].map((strong) => strong.textContent?.trim())).toEqual(['See', 'here']);
  expect(container.querySelector('strong div, strong img')).toBeNull();
});

it('keeps gallery link buttons inline in their sentence', () => {
  const onMediaClick = vi.fn();
  const { container } = render(<MarkdownRenderer content="Before [View ![Flag](/flag.jpg) here](image:/gallery.jpg) after" onMediaClick={onMediaClick} />);
  const paragraphs = container.querySelectorAll('p');
  expect(paragraphs).toHaveLength(1);
  expect(paragraphs[0].querySelector('button')).not.toBeNull();
  fireEvent.click(paragraphs[0].querySelector('button')!);
  expect(onMediaClick).toHaveBeenCalledWith('image', '/gallery.jpg', expect.any(String));
});

it.each([
  ['an unsafe destination', 'image:file:/gallery.jpg'],
  ['an empty destination', 'image:'],
])('lifts media out of a gallery link with %s that the URL filter rejects', (_case, href) => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const content = `Before [View ![Flag](/flag.jpg) here](${href}) after`;
  const { container } = render(<MarkdownRenderer content={content} />);
  expect(container.querySelector('button')).toBeNull();
  expect(container.querySelector('p div, p img')).toBeNull();
  expect(errors.mock.calls.filter((call) => String(call[0]).includes('validateDOMNesting'))).toEqual([]);
});

// Content models from the HTML standard: these elements accept phrasing content
// only, and links and buttons must not contain interactive content.
const PHRASING_ONLY = 'p, h1, h2, h3, h4, h5, h6, em, strong, del, span, sup, button';
const FLOW = 'div, p, h1, h2, h3, h4, h5, h6, ul, ol, li, section, blockquote, table, audio, video';
const INTERACTIVE = 'a[href], button, input, select, textarea, audio[controls], video[controls]';

function invalidNesting(root: Element): string[] {
  const found: string[] = [];
  for (const outer of root.querySelectorAll(PHRASING_ONLY)) {
    for (const inner of outer.querySelectorAll(FLOW)) found.push(`${outer.tagName} > ${inner.tagName}`);
  }
  for (const outer of root.querySelectorAll('a, button')) {
    for (const inner of outer.querySelectorAll(INTERACTIVE)) found.push(`${outer.tagName} > ${inner.tagName}`);
  }
  return found;
}

/** Element structure and text, ignoring React's text separators and attribute serialization. */
function outline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  return `<${node.nodeName}>${[...node.childNodes].map(outline).join('')}</${node.nodeName}>`;
}

/** Render like SSR plus a browser: parse server HTML, compare with the client tree, then hydrate it. */
async function expectConsistentBrowserTree(content: string): Promise<HTMLElement> {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const view = <MarkdownRenderer content={content} />;
  const container = document.createElement('div');
  container.innerHTML = renderToString(view);
  const parsedServerTree = outline(container);
  const { container: client, unmount } = render(view);
  expect(parsedServerTree).toBe(outline(client));
  unmount();
  expect(invalidNesting(container)).toEqual([]);
  document.body.append(container);
  const recover = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => { root = hydrateRoot(container, view, { onRecoverableError: recover }); });
  expect(recover).not.toHaveBeenCalled();
  expect(errors.mock.calls.filter((call) => /validateDOMNesting|hydrat|cannot (be|contain)/i.test(String(call[0])))).toEqual([]);
  onTestFinished(() => { act(() => root?.unmount()); container.remove(); });
  return container;
}

it.each([
  ['a tight list item', '- *Before ![Picture](/one.jpg) after*\n- Plain ![Guide](/guide.mp3) item'],
  ['a table cell', '| Object |\n| --- |\n| *Before ![Picture](/one.jpg) after* |'],
])('keeps media out of emphasis in %s', async (_case, content) => {
  const container = await expectConsistentBrowserTree(content);
  const cell = container.querySelector('li, td')!;
  expect([...cell.childNodes].map((node) => node.nodeName)).toEqual(['EM', 'DIV', 'EM']);
  expect(cell.textContent).toMatch(/^Before Picture after$/);
});

it('places media after the heading text and keeps the heading', async () => {
  const container = await expectConsistentBrowserTree('## Title ![Audio guide](/guide.mp3)\n\n### *Room ![Map](/map.jpg)*\n\n## ![Banner](/banner.jpg)');
  const headings = container.querySelectorAll('h2, h3');
  expect([...headings].map((heading) => `${heading.tagName} ${heading.textContent?.trim()}`)).toEqual(['H2 Title', 'H3 Room']);
  expect(headings[0].nextElementSibling?.querySelector('audio')).not.toBeNull();
  expect(headings[1].nextElementSibling?.querySelector('img')).toHaveAttribute('alt', 'Map');
  // An image-only heading leaves the image without an empty heading.
  expect(container.querySelector('img[alt="Banner"]')?.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
});

it('keeps a heading link labelled and moves its media after the heading', async () => {
  const container = await expectConsistentBrowserTree('## [Plan ![Floor](/floor.jpg)](https://example.com/plan)');
  const links = container.querySelectorAll('a');
  expect(links).toHaveLength(1);
  expect(links[0].closest('h2')).not.toBeNull();
  expect(links[0]).toHaveTextContent('Plan Floor');
  expect(container.querySelector('h2')?.nextElementSibling?.querySelector('img')).toHaveAttribute('alt', 'Floor');
});

it.each([
  ['audio', 'Intro [Listen ![Guide](/guide.mp3) now](https://example.com) outro.', 'Listen Guide now', 'audio'],
  ['video', '[![Clip](/clip.webm)](https://example.com)', 'Clip', 'video'],
  // Without alt text the link would have no accessible name, so it shows its destination.
  ['unlabelled audio', '[![](/guide.mp3)](https://example.com)', 'https://example.com', 'audio'],
  ['audio beside an unlabelled image', '[![](/cover.jpg) ![](/guide.mp3)](https://example.com)', 'https://example.com', 'audio'],
  ['players split by a hard break', '[![](/guide.mp3)  \n![](/clip.webm)](https://example.com)', 'https://example.com', 'video'],
])('keeps %s player controls outside the one link that labels them', async (_type, content, label, player) => {
  const container = await expectConsistentBrowserTree(content);
  const links = container.querySelectorAll('a');
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute('href', 'https://example.com');
  expect(links[0]).toHaveTextContent(label);
  const media = container.querySelector(player)!;
  expect(media.closest('a')).toBeNull();
  // The player follows its link, so content keeps its reading order.
  expect(links[0].compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('places a footnote reference after the link that contained it', async () => {
  const container = await expectConsistentBrowserTree('See [the record[^1]](https://example.com) here.\n\n[^1]: Archive note.');
  const link = container.querySelector('a[href="https://example.com"]')!;
  expect(link).toHaveTextContent(/^the record$/);
  expect(link.querySelector('a, sup')).toBeNull();
  expect(link.nextElementSibling?.tagName).toBe('SUP');
  expect(link.nextElementSibling?.querySelector('a')).toHaveAttribute('href', '#user-content-fn-1');
  expect(link.closest('p')).toHaveTextContent(/^See the record1 here\.$/);
});

it('keeps words apart where media leave a heading or a link label', async () => {
  const container = await expectConsistentBrowserTree('## [See![Floor](/floor.jpg)now](/plan)\n\n### Room![Map](/map.jpg)two');
  expect(container.querySelector('h2 a')?.textContent).toBe('See Floor now');
  expect(container.querySelector('h3')?.textContent).toBe('Room two');
});

it('keeps words apart across adjacent media without alt text', async () => {
  const container = await expectConsistentBrowserTree('## Room![](/one.jpg)![](/two.jpg)two\n\n[Listen![](/guide.mp3)![](/clip.webm)now](/guide)');
  expect(container.querySelector('h2')?.textContent).toBe('Room two');
  expect(container.querySelector('a')?.textContent).toBe('Listen now');
});

it('keeps an icon-only gallery button beside media in a heading without text', async () => {
  const container = await expectConsistentBrowserTree('## ![Map](/map.jpg) [](audio:/guide.mp3)');
  expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  const button = container.querySelector('button.inline-flex')!;
  expect(button).not.toBeNull();
  expect(container.querySelector('img[alt="Map"]')!.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('keeps a hard break in a link that falls back to its destination as label', async () => {
  const container = await expectConsistentBrowserTree('[![](/cover.jpg)  \n![](/guide.mp3)](/guide)');
  const link = container.querySelector('a')!;
  expect(link.querySelector('img[src="/cover.jpg"]')).not.toBeNull();
  expect(link.querySelector('br')).not.toBeNull();
  expect(link).toHaveTextContent('/guide');
  expect(container.querySelector('audio')?.closest('a')).toBeNull();
});

it('drops a heading left with only a line break', async () => {
  const container = await expectConsistentBrowserTree('![A](/a.jpg)  \n![B](/b.jpg)\n---');
  expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  expect([...container.querySelectorAll('img')].map((img) => img.alt)).toEqual(['A', 'B']);
});

it('keeps media order when an unlabelled link with a rejected destination is dropped', async () => {
  const container = await expectConsistentBrowserTree('[![](/guide.mp3) ![](/cover.jpg)](image:file:/gallery.jpg)');
  expect(container.querySelector('a, button.inline-flex')).toBeNull();
  const audio = container.querySelector('audio')!;
  const image = container.querySelector('img[src="/cover.jpg"]')!;
  expect(audio.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
