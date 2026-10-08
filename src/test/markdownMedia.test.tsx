import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { extractMediaFromMarkdown } from '../utils/markdownUtils';

vi.mock('../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));

it.each(['audio', 'video', 'image'] as const)('opens safe %s wrappers using keyboard activation', async (type) => {
  const onMediaClick = vi.fn();
  const user = userEvent.setup();
  const url = 'https://example.com/media?one=1&two=2#section';
  render(<MarkdownRenderer content={`[Guide](${type}:${url})`} onMediaClick={onMediaClick} />);
  const button = screen.getByRole('button', { name: 'Guide' });
  button.focus();
  await user.keyboard('{Enter}');
  expect(onMediaClick).toHaveBeenCalledWith(type, url, 'Guide');
});

it.each(['asset-id', '/uploads/audio.mp3', '../uploads/audio.mp3', '//example.com/audio.mp3'])('preserves safe relative/asset destinations: %s', (url) => {
  const onMediaClick = vi.fn();
  render(<MarkdownRenderer content={`[Guide](audio:${url})`} onMediaClick={onMediaClick} />);
  fireEvent.click(screen.getByRole('button', { name: 'Guide' }));
  expect(onMediaClick).toHaveBeenCalledWith('audio', url, 'Guide');
});

it.each(['javascript:evil', 'JaVaScRiPt:evil', 'data:text/html,evil', 'file:/private/file', 'video:javascript:evil'])('blocks an unsafe destination inside a media wrapper: %s', (url) => {
  const onMediaClick = vi.fn();
  render(<MarkdownRenderer content={`[Unsafe](audio:${url})`} onMediaClick={onMediaClick} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByText('Unsafe')).toHaveAttribute('href', '');
  expect(onMediaClick).not.toHaveBeenCalled();
});

it('retains ordinary link safety and normal HTTPS links', () => {
  render(<MarkdownRenderer content="[Unsafe](javascript:evil) [Safe](https://example.com/page)" />);
  expect(screen.getByText('Unsafe')).toHaveAttribute('href', '');
  expect(screen.getByRole('link', { name: 'Safe' })).toHaveAttribute('href', 'https://example.com/page');
});

it.each([
  ['/uploads/audio.MP3?version=2#start', 'audio'],
  ['https://example.com/video.webm?format=image.jpg#end', 'video'],
] as const)('renders and extracts %s consistently as %s', (url, type) => {
  const markdown = `![Media](${url})`;
  const { container } = render(<MarkdownRenderer content={markdown} />);
  expect(container.querySelector(type)).toHaveAttribute('src', url);
  if (type === 'audio') expect(screen.getByRole('button', { name: 'playAudio' })).toBeInTheDocument();
  expect(container.querySelector('img')).not.toBeInTheDocument();
  const extracted = extractMediaFromMarkdown(markdown);
  expect(type === 'audio' ? extracted.audio : extracted.videos).toEqual([{ url, title: 'Media' }]);
  expect(extracted.images).toEqual([]);
});
