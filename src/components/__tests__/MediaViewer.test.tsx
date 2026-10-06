import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MediaViewer } from '../MediaViewer';
import { MediaViewerPage } from '../MediaViewerPage';

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));

const empty = { images: [], videos: [], audio: [] };
const movie = { url: '/movie.webm', title: 'Film', description: '' };
const recording = { url: '/recording.mp3', title: 'Recording', description: '' };

describe('visitor media selection', () => {
  it('opens a page without a tab query at its first image', () => {
    const { container } = render(<MediaViewerPage {...empty} images={['/one.jpg']} initialTab={null} onBack={() => {}} />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg');
  });

  it.each(['page', 'modal'] as const)('opens video-only %s content without declaring the wrong format', (variant) => {
    const media = { ...empty, videos: [movie] };
    const { container } = render(variant === 'page'
      ? <MediaViewerPage {...media} onBack={() => {}} />
      : <MediaViewer {...media} isOpen onClose={() => {}} />);
    expect(container.querySelector('video')).toHaveAttribute('src', movie.url);
    expect(container.querySelector('source')).toBeNull();
  });

  it.each(['page', 'modal'] as const)('opens audio-only %s content', (variant) => {
    const media = { ...empty, audio: [recording] };
    const { container } = render(variant === 'page'
      ? <MediaViewerPage {...media} onBack={() => {}} />
      : <MediaViewer {...media} isOpen onClose={() => {}} />);
    expect(container.querySelector('audio')).toHaveAttribute('src', recording.url);
  });

  it('falls back from an unavailable tab and reacts to a new linked image', () => {
    const props = { ...empty, images: ['/one.jpg', '/two.jpg'], onBack: () => {} };
    const { container, rerender } = render(<MediaViewerPage {...props} initialTab="audio" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg');
    rerender(<MediaViewerPage {...props} initialTab="images" initialUrl="/two.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/two.jpg');
  });

  it.each(['page', 'modal'] as const)('preserves selected image URLs through live reordering and removal in a %s', (variant) => {
    const view = (images: string[]) => variant === 'page'
      ? <MediaViewerPage {...empty} images={images} onBack={() => {}} />
      : <MediaViewer {...empty} images={images} isOpen onClose={() => {}} />;
    const { container, rerender } = render(view(['/one.jpg', '/two.jpg']));
    fireEvent.click(screen.getByRole('button', { name: 'Thumbnail 2' }));
    expect(container.querySelector('img')).toHaveAttribute('src', '/two.jpg');
    rerender(view(['/two.jpg', '/one.jpg']));
    expect(container.querySelector('img')).toHaveAttribute('src', '/two.jpg');
    rerender(view(['/one.jpg']));
    expect(container.querySelector('img')).toHaveAttribute('src', '/one.jpg');
  });

  it('falls back when the active media category is removed live', () => {
    const { container, rerender } = render(<MediaViewerPage {...empty} videos={[movie]} audio={[recording]} onBack={() => {}} />);
    expect(container.querySelector('video')).toBeInTheDocument();
    rerender(<MediaViewerPage {...empty} audio={[recording]} onBack={() => {}} />);
    expect(container.querySelector('audio')).toHaveAttribute('src', recording.url);
  });
});
