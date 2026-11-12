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
