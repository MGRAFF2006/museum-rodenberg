import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('Markdown media URLs', () => {
  it.each([
    ['audio', '/uploads/recording.mp3'],
    ['video', 'https://museum.example/film.webm'],
    ['image', '/uploads/photo.jpg'],
    ['audio', 'recording.mp3'],
  ])('opens a valid %s target through the actual Markdown renderer', (type, url) => {
    const onMediaClick = vi.fn();
    render(<MarkdownRenderer content={`[Open recording](${type}:${url})`} onMediaClick={onMediaClick} />);
    fireEvent.click(screen.getByRole('button', { name: /Open recording/ }));
    expect(onMediaClick).toHaveBeenCalledWith(type, url, 'Open recording');
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'audio:javascript:alert(1)',
    'video:data:text/html;base64,PHNjcmlwdD4=',
    'image:mailto:visitor@example.org',
    'audio:vbscript:msgbox',
  ])('rejects the unsafe or non-media target %s', url => {
    const onMediaClick = vi.fn();
    const { container } = render(<MarkdownRenderer content={`[Unsafe](${url})`} onMediaClick={onMediaClick} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('[href],[src]')).toBeNull();
    fireEvent.click(screen.getByText('Unsafe'));
    expect(onMediaClick).not.toHaveBeenCalled();
  });

  it('preserves ordinary safe links and supported inline media', () => {
    const { container } = render(<MarkdownRenderer content={'[Museum](https://museum.example)\n\n![Film](/uploads/film.webm)'} />);
    expect(screen.getByRole('link', { name: 'Museum' })).toHaveAttribute('href', 'https://museum.example');
    expect(container.querySelector('video')).toHaveAttribute('src', '/uploads/film.webm');
  });
});
