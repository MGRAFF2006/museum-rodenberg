import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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
