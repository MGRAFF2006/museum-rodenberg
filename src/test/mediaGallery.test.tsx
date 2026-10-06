import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import App from '../App';
import { MediaViewer } from '../components/MediaViewer';
import { MediaViewerPage } from '../components/MediaViewerPage';
import { DetailedContentModal } from '../components/DetailedContentModal';
import type { Artifact, Exhibition, RequiredMedia } from '../types';

let mobile = true;
let record: Artifact & Exhibition;
vi.mock('../hooks/useLanguage', () => ({ useLanguage: () => ({ currentLanguage: 'de', t: (key: string) => key }) }));
vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: () => mobile }));
vi.mock('../hooks/useContentData', () => ({ useContentData: () => ({
  exhibitions: [record], artifacts: [record], featuredExhibitionId: record.id, resolveAsset: () => undefined,
  getExhibitionById: (id: string) => id === record.id ? record : undefined,
  getArtifactById: (id: string) => id === record.id ? record : undefined,
  getArtifactsByExhibition: () => [], findByQRCode: () => ({ type: null, item: null }),
}) }));
vi.mock('convex/react', () => ({ useQuery: (_query: unknown, args: unknown) => args === 'skip' ? undefined : {
  _id: 'record', slug: record.id, qrCode: record.qrCode, image: record.image,
  translations: [{ language: 'de', title: record.title, description: record.description,
    detailedContent: record.detailedContent?.de }],
  media: [
    ...(record.media?.images ?? []).map((url, sortOrder) => ({ mediaType: 'image', url, sortOrder })),
    ...(record.media?.videos ?? []).map(item => ({ ...item, mediaType: 'video', sortOrder: 0 })),
    ...(record.media?.audio ?? []).map(item => ({ ...item, mediaType: 'audio', sortOrder: 0 })),
  ], enabledAttributes: record.enabledAttributes,
} }));
vi.mock('../components/Header', () => ({ Header: () => null }));
vi.mock('../components/MobileMenu', () => ({ MobileMenu: () => null }));
vi.mock('../components/AccessibilityPanel', () => ({ AccessibilityPanel: () => null }));
vi.mock('../components/TextToSpeechButton', () => ({ TextToSpeechButton: () => null }));

const blank: RequiredMedia = { images: [], videos: [], audio: [] };
const item = (url: string) => ({ url, title: 'Media item', description: '' });
function gallery(mode: 'modal' | 'page', media: RequiredMedia, url?: string, tab?: 'images' | 'videos' | 'audio') {
  return mode === 'page'
    ? <MediaViewerPage {...media} onBack={() => {}} initialTab={tab} initialUrl={url} />
    : <MediaViewer {...media} isOpen onClose={() => {}} initialItem={url ? { type: tab === 'videos' ? 'video' : tab === 'audio' ? 'audio' : 'image', url } : undefined} />;
}
function Location({ next }: { next?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname + location.search}</output>{next && <button onClick={() => navigate(next)}>Next entity</button>}</>;
}
function page(path: string, next?: string) {
  return <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /><Location next={next} /></MemoryRouter>;
}

beforeEach(() => {
  mobile = true;
  record = { id: 'object', qrCode: 'OBJECT', title: 'Object title', description: 'Description', image: '/hero.jpg', media: { images: ['/first.jpg', '/second.jpg'], videos: [], audio: [] } };
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: vi.fn(), configurable: true });
});

describe.each(['modal', 'page'] as const)('%s media selection', (mode) => {
  it.each(['video', 'audio'] as const)('opens the first populated tab for %s-only galleries', (type) => {
    const view = render(gallery(mode, { ...blank, [type === 'video' ? 'videos' : 'audio']: [item(`/only.${type === 'video' ? 'webm' : 'mp3'}`)] }));
    expect(view.container.querySelector(type)).toBeInTheDocument();
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
  });

  it('keeps the selected image after reorder and chooses the first remaining image after removal', () => {
    const view = render(gallery(mode, { ...blank, images: ['/first.jpg', '/second.jpg'] }));
    fireEvent.click(screen.getByAltText('Thumbnail 2'));
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/second.jpg');
    view.rerender(gallery(mode, { ...blank, images: ['/second.jpg', '/first.jpg'] }));
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/second.jpg');
    view.rerender(gallery(mode, { ...blank, images: ['/remaining.jpg'] }));
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/remaining.jpg');
  });

  it('responds to changed selection props and falls back when a tab disappears', () => {
    const media = { images: ['/first.jpg', '/second.jpg'], videos: [], audio: [item('/sound.mp3')] };
    const view = render(gallery(mode, media, '/second.jpg', 'images'));
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/second.jpg');
    view.rerender(gallery(mode, media, '/sound.mp3', 'audio'));
    expect(view.container.querySelector('audio')).toHaveAttribute('src', '/sound.mp3');
    view.rerender(gallery(mode, { ...blank, images: ['/only.jpg'] }));
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/only.jpg');
  });

  it('opens a selected Markdown-only item without modifying its published gallery', () => {
    const media = { ...blank, images: ['/gallery.jpg'] };
    const view = render(gallery(mode, media, '/description.jpg', 'images'));
    expect(view.container.querySelector('img')).toHaveAttribute('src', '/description.jpg');
    expect(media.images).toEqual(['/gallery.jpg']);
  });
});

it.each([null, 'invalid', 'videos'])('falls back to available images for tab=%s', (tab) => {
  const view = render(<MediaViewerPage {...blank} images={['/first.jpg']} onBack={() => {}} initialTab={tab} />);
  expect(view.container.querySelector('img')).toHaveAttribute('src', '/first.jpg');
});

describe.each(['artifact', 'exhibition'] as const)('%s media routes', (type) => {
  it('opens the gallery with no tab query instead of an empty page', async () => {
    render(page(`/${type}/object/media`));
    expect(await screen.findByAltText('image 1')).toHaveAttribute('src', '/first.jpg');
  });

  it('preserves the clicked mobile gallery image in route parameters', async () => {
    render(page(`/${type}/object`));
    fireEvent.click(await screen.findByAltText('Media 2'));
    expect(await screen.findByAltText('image 2')).toHaveAttribute('src', '/second.jpg');
    const query = new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1]);
    expect(query.get('tab')).toBe('images');
    expect(query.get('url')).toBe('/second.jpg');
  });

  it.each([true, false])('opens description-only Markdown images (mobile=%s)', async (isMobile) => {
    mobile = isMobile;
    const url = '/description.jpg?size=large&view=1';
    record.description = `![Description picture](${url})`;
    delete record.media;
    render(page(`/${type}/object`));
    fireEvent.click(await screen.findByAltText('Description picture'));
    expect(await screen.findByAltText(isMobile ? 'image 1' : 'images 1')).toHaveAttribute('src', url);
    if (isMobile) {
      const query = new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1]);
      expect(query.get('url')).toBe(url);
    }
  });

  it('selects a remaining image when reactive gallery data removes the old selection', async () => {
    const view = render(page(`/${type}/object/media`));
    fireEvent.click(await screen.findByAltText('Thumbnail 2'));
    record = { ...record, media: { images: ['/replacement.jpg'] } };
    view.rerender(page(`/${type}/object/media`));
    expect(await screen.findByAltText('image 1')).toHaveAttribute('src', '/replacement.jpg');
  });

  it('resets the active tab when navigating to another entity', async () => {
    record.media = { ...record.media, audio: [item('/sound.mp3')] };
    render(page(`/${type}/object/media`, `/${type}/other/media`));
    fireEvent.click(await screen.findByRole('button', { name: 'audio (1)' }));
    expect(document.querySelector('audio')).toBeInTheDocument();
    record = { ...record, id: 'other', media: { images: ['/other.jpg'], audio: [item('/other.mp3')] } };
    fireEvent.click(screen.getByRole('button', { name: 'Next entity' }));
    expect(await screen.findByAltText('image 1')).toHaveAttribute('src', '/other.jpg');
    expect(document.querySelector('audio')).not.toBeInTheDocument();
  });
});

it('opens Markdown-only media inside desktop detailed content', () => {
  render(<DetailedContentModal isOpen onClose={() => {}} title="Details" content="![Detail image](/detail-only.jpg)" />);
  fireEvent.click(screen.getByAltText('Detail image'));
  expect(screen.getByAltText('images 1')).toHaveAttribute('src', '/detail-only.jpg');
});

it.each(['artifact', 'exhibition'] as const)('enumerates all article-only media on the %s route without a selection query', async type => {
  delete record.media;
  record.description = '![Description picture](/description.jpg)';
  record.detailedContent = { de: '![Article picture](/article.jpg)' };
  render(page(`/${type}/object/media`));
  expect(await screen.findByAltText('image 1')).toHaveAttribute('src', '/description.jpg');
  fireEvent.click(screen.getByAltText('Thumbnail 2'));
  expect(screen.getByAltText('image 2')).toHaveAttribute('src', '/article.jpg');
});
it('excludes hidden attribute media from the route gallery', async () => {
  record.enabledAttributes = ['title', 'media'];
  record.description = '![Hidden picture](/hidden.jpg)';
  record.detailedContent = { de: '![Hidden article](/hidden-article.jpg)' };
  render(page('/artifact/object/media'));
  await screen.findByAltText('image 1');
  expect(screen.queryByAltText('Thumbnail 3')).not.toBeInTheDocument();
});
it('shows all article images in the desktop detailed gallery before selecting an individual embed', () => {
  render(<DetailedContentModal isOpen onClose={() => {}} title="Details" content="![First](/first.jpg) ![Second](/second.jpg)" />);
  fireEvent.click(screen.getAllByRole('button', { name: 'media' })[0]);
  expect(screen.getByAltText('Thumbnail 2')).toHaveAttribute('src', '/second.jpg');
});
