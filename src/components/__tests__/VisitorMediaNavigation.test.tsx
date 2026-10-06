import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { ArtifactDetail } from '../ArtifactDetail';
import { ExhibitionDetail } from '../ExhibitionDetail';
import { DetailedContentModal } from '../DetailedContentModal';

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ currentLanguage: 'de', t: (key: string) => key }) }));
vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => true }));
vi.mock('../TextToSpeechButton', () => ({ TextToSpeechButton: () => null }));
vi.mock('../AccessibilityPanel', () => ({ AccessibilityPanel: () => null }));
vi.mock('../../hooks/useContentData', () => ({
  useContentData: () => ({
    exhibitions: [], artifacts: [], resolveAsset: () => undefined,
    getExhibitionById: () => item, getArtifactById: () => item,
    getArtifactsByExhibition: () => [], findByQRCode: () => ({ type: null, item: null }),
  }),
}));
vi.mock('convex/react', () => ({
  useQuery: (_query: unknown, args: unknown) => args === 'skip' ? undefined : {
    _id: 'record', slug: 'item', qrCode: 'QR', image: '/hero.jpg',
    translations: [{ language: 'de', title: 'Museum object', description: '',
      detailedContent: '![Article photo](/article-only.jpg)' }],
    media: [
      { mediaType: 'image', url: '/one.jpg', sortOrder: 0 },
      { mediaType: 'image', url: '/two.jpg', sortOrder: 1 },
    ],
  },
}));

const item = { id: 'item', qrCode: 'QR', image: '/hero.jpg', title: 'Object',
  description: '![Inline photo](/article-only.jpg)', media: { images: ['/one.jpg', '/two.jpg'] } };

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('visitor media navigation', () => {
  it.each(['artifact', 'exhibition'] as const)('preserves a clicked %s image for the mobile route', (type) => {
    const onMediaViewerClick = vi.fn();
    render(type === 'artifact'
      ? <ArtifactDetail artifact={item} onBack={() => {}} onMediaViewerClick={onMediaViewerClick} />
      : <ExhibitionDetail exhibition={item} artifacts={[]} onBack={() => {}} onArtifactClick={() => {}} onMediaViewerClick={onMediaViewerClick} />);
    fireEvent.click(screen.getByAltText('Media 2'));
    expect(onMediaViewerClick).toHaveBeenCalledWith('image', '/two.jpg');
    fireEvent.click(screen.getByAltText('Inline photo'));
    expect(onMediaViewerClick).toHaveBeenLastCalledWith('image', '/article-only.jpg');
  });

  it('opens detailed Markdown images without separately declared media', () => {
    const { container } = render(<DetailedContentModal isOpen title="Article" content="![Article photo](/article-only.jpg)" onClose={() => {}} />);
    fireEvent.click(screen.getByAltText('Article photo'));
    expect(container.querySelector('img[alt="images 1"]')).toHaveAttribute('src', '/article-only.jpg');
  });

  it.each(['', '?tab=wrong', '?tab=images&url=%2Farticle-only.jpg'])('loads article-only media on a direct route%s', async query => {
    const { container } = render(<MemoryRouter initialEntries={[`/artifact/item/media${query}`]}><App /></MemoryRouter>);
    await screen.findByText('media', { selector: 'h1' });
    expect(container.querySelector('img:not([alt^="Thumbnail"])')).toHaveAttribute('src', query.includes('url=') ? '/article-only.jpg' : '/one.jpg');
  });

  it('carries a clicked mobile thumbnail through App routing to the selected gallery image', async () => {
    const { container } = render(<MemoryRouter initialEntries={['/artifact/item']}><App /><Location /></MemoryRouter>);
    fireEvent.click(await screen.findByAltText('Media 2'));
    await screen.findByText('media', { selector: 'h1' });
    expect(screen.getByTestId('location')).toHaveTextContent('/artifact/item/media?tab=images&url=%2Ftwo.jpg');
    expect(container.querySelector('img:not([alt^="Thumbnail"])')).toHaveAttribute('src', '/two.jpg');
  });
});
