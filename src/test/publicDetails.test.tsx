import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { useQuery } from 'convex/react';
import App from '../App';
import { ContentProvider } from '../contexts/ContentContext';
import type { Language } from '../types';
import type { ConvexArtifact, ConvexExhibition } from '../utils/convexConverters';

vi.mock('convex/react', () => ({ useQuery: vi.fn() }));
vi.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({ currentLanguage: language, t: (key: string) => key }),
}));
vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: () => mobile }));
vi.mock('../components/Header', () => ({ Header: () => null }));
vi.mock('../components/MobileMenu', () => ({ MobileMenu: () => null }));
vi.mock('../components/AccessibilityPanel', () => ({ AccessibilityPanel: () => null }));
vi.mock('../components/TextToSpeechButton', () => ({ TextToSpeechButton: () => null }));

let language: Language;
let mobile: boolean;
let record: ConvexArtifact & ConvexExhibition;
let response: typeof record | null | undefined;

function publicPage(path: string) {
  return (
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ContentProvider><App /></ContentProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  language = 'en';
  mobile = true;
  record = {
    _id: 'stored-item', slug: 'stored-item', qrCode: 'ITEM', image: 'image-asset',
    isFeatured: false, artifactSlugs: [], enabledAttributes: ['description', 'detailedContent'],
    translations: [
      { language: 'de', title: 'Deutscher Titel', description: 'Beschreibung', detailedContent: 'Deutsche Details' },
      { language: 'en', title: 'English title', description: 'Description', detailedContent: 'English details' },
    ],
    media: [],
  };
  response = record;
  vi.mocked(useQuery).mockImplementation((query, args = undefined) => {
    if (args === 'skip') return undefined;
    const name = getFunctionName(query);
    if (name.endsWith(':getBySlug')) return response;
    if (name.endsWith(':listForLanguage')) {
      // The public list deliberately omits detailedContent, unlike getBySlug.
      return [{ ...record, translations: record.translations.map(translation => {
        const lean = { ...translation };
        delete lean.detailedContent;
        return lean;
      }) }];
    }
    if (name === 'assets:list') return [{ _id: 'asset', assetId: 'image-asset', name: 'Image', alt: 'Alt', url: '/resolved.jpg', type: 'image' }];
    if (name === 'exhibitions:getFeatured') return record.slug;
    throw new Error(`Unexpected query: ${name}`);
  });
});

describe.each(['artifact', 'exhibition'] as const)('%s public detailed content', (type) => {
  it.each([true, false])('opens stored details from the item page (mobile: %s)', async (isMobile) => {
    mobile = isMobile;
    render(publicPage(`/${type}/${record.slug}`));
    fireEvent.click(await screen.findByRole('button', { name: 'readMore' }));
    expect(await screen.findByText('English details')).toBeVisible();
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), { slug: record.slug });
    const fullQueries = vi.mocked(useQuery).mock.calls.filter(([, args]) => args && args !== 'skip' && 'slug' in args);
    expect(fullQueries.every(([query]) => getFunctionName(query) === `${type}s:getBySlug`)).toBe(true);
  });

  it('renders requested-language details on a direct URL and resolves assets', async () => {
    record.translations[1].detailedContent = 'English details\n\n[Picture](image-asset)';
    render(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByRole('heading', { name: 'English title' })).toBeVisible();
    expect(screen.getByText('English details')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Picture' })).toHaveAttribute('href', '/resolved.jpg');
    expect(screen.queryByText('Deutsche Details')).not.toBeInTheDocument();
  });

  it.each([true, false])('opens German fallback from the item page (mobile: %s)', async (isMobile) => {
    mobile = isMobile;
    delete record.translations[1].detailedContent;
    render(publicPage(`/${type}/${record.slug}`));
    fireEvent.click(await screen.findByRole('button', { name: 'readMore' }));
    expect(await screen.findByText('Deutsche Details')).toBeVisible();
  });

  it('renders German fallback on a direct URL', async () => {
    record.translations[1].detailedContent = '';
    render(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByText('Deutsche Details')).toBeVisible();
  });

  it('uses German when the selected translation is absent', async () => {
    language = 'nl';
    render(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByRole('heading', { name: 'Deutscher Titel' })).toBeVisible();
    expect(screen.getByText('Deutsche Details')).toBeVisible();
  });

  it('allows details when enabledAttributes was never configured', async () => {
    delete record.enabledAttributes;
    render(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByText('English details')).toBeVisible();
  });

  it('updates details when the selected language changes', async () => {
    record.translations.push({ language: 'fr', title: 'Titre français', description: 'Description', detailedContent: 'Détails français' });
    const view = render(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByText('English details')).toBeVisible();
    language = 'fr';
    view.rerender(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByText('Détails français')).toBeVisible();
    expect(screen.queryByText('English details')).not.toBeInTheDocument();
  });

  it.each(['disabled', 'absent', 'other-language'] as const)('hides the action and rejects direct details when %s', async (condition) => {
    if (condition === 'disabled') record.enabledAttributes = ['description'];
    else {
      record.translations.forEach(translation => { delete translation.detailedContent; });
      if (condition === 'other-language') record.translations.push({ language: 'fr', title: 'Titre', description: 'Description', detailedContent: 'Détails français' });
    }
    const view = render(publicPage(`/${type}/${record.slug}`));
    await screen.findByRole('heading', { name: 'English title' });
    expect(screen.queryByRole('button', { name: 'readMore' })).not.toBeInTheDocument();
    view.unmount();
    render(publicPage(`/${type}/${record.slug}/details`));
    expect(await screen.findByText('Content not found')).toBeVisible();
    expect(screen.queryByText('English details')).not.toBeInTheDocument();
  });

  it.each(['', '/details'])('reports a nonexistent slug on the %s route', async (suffix) => {
    response = null;
    render(publicPage(`/${type}/missing${suffix}`));
    expect(await screen.findByText(suffix ? 'Content not found' : `${type === 'artifact' ? 'Artifact' : 'Exhibition'} not found`)).toBeVisible();
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), { slug: 'missing' });
  });

  it.each(['', '/details'])('shows loading before the full record arrives on the %s route', async (suffix) => {
    response = undefined;
    const view = render(publicPage(`/${type}/${record.slug}${suffix}`));
    expect(await screen.findByRole('status')).toBeVisible();
    expect(screen.queryByText(/not found/)).not.toBeInTheDocument();
    response = record;
    view.rerender(publicPage(`/${type}/${record.slug}${suffix}`));
    expect(await screen.findByRole('heading', { name: 'English title' })).toBeVisible();
    if (suffix) expect(screen.getByText('English details')).toBeVisible();
    else expect(screen.getByRole('button', { name: 'readMore' })).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
