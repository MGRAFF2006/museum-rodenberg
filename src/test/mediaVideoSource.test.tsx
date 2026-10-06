import { expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MediaViewerPage } from '../components/MediaViewerPage';

vi.mock('../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));

it.each(['/movie.webm', '/movie.mp4', '/stream?format=webm'])('leaves the browser free to detect the format of %s', (url) => {
  const { container } = render(<MediaViewerPage images={[]} audio={[]} videos={[{ url, title: 'Movie', description: '' }]} initialTab="videos" onBack={() => {}} />);
  const source = container.querySelector('source')!;
  expect(source.src).toBe(new URL(url, document.baseURI).href);
  // An empty source.type instructs the browser to probe the actual resource;
  // declaring MP4 would let it skip WebM before fetching its media metadata.
  expect(source.type).toBe('');
});
