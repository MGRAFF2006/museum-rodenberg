import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ArtifactEditor } from '../../components/Admin/ArtifactEditor';
import { ExhibitionEditor } from '../../components/Admin/ExhibitionEditor';
import { convexArtifactToRaw, convexExhibitionToRaw } from '../../utils/convexConverters';

const mocks = vi.hoisted(() => ({ query: vi.fn(), fetch: vi.fn() }));
vi.mock('convex/react', () => ({ useQuery: mocks.query }));
vi.mock('../useContentData', () => ({ useContentData: () => ({ exhibitions: [], artifacts: [], refreshData: vi.fn() }) }));
vi.mock('../useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../useContentTranslation', () => ({ useContentTranslation: () => ({
  isTranslating: false, translationProgress: { current: 0, total: 0 }, translateFields: vi.fn(),
}) }));
vi.mock('../useAssets', () => ({ useAssets: () => ({ isLoading: false, resolveAsset: () => undefined }) }));
vi.mock('../../components/Admin/AssetSelector', () => ({ AssetSelector: () => null }));
vi.mock('../../components/Admin/VisualEditor', () => ({ VisualEditor: () => null }));

function fixture(revision?: number) {
  return { _id: 'object', slug: 'object', revision, qrCode: 'qr', image: '', isFeatured: false,
    artifactSlugs: [], enabledAttributes: [], media: [],
    translations: [{ language: 'de', title: 'Initial title', description: 'Story' }],
  };
}

beforeEach(() => {
  mocks.query.mockReturnValue(fixture(4));
  mocks.fetch.mockReset();
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each([['artifact', ArtifactEditor], ['exhibition', ExhibitionEditor]] as const)(
  'keeps an edited %s draft and its original revision after a stale HTTP response', async (type, Editor) => {
    const onBack = vi.fn();
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { rerender } = render(<Editor id="object" onBack={onBack} />);
    fireEvent.change(screen.getByDisplayValue('Initial title'), { target: { value: 'Unsaved curator draft' } });
    mocks.query.mockReturnValue(fixture(5));
    rerender(<Editor id="object" onBack={onBack} />);
    mocks.fetch.mockResolvedValue(new Response('{}', { status: 409 }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
    const request = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(request.operation).toBe(`${type}s:save`);
    expect(request.args.expectedRevision).toBe(4);
    expect(request.args.expectedDocumentId).toBe('object');
    expect(screen.getByDisplayValue('Unsaved curator draft')).toBeInTheDocument();
    expect(screen.getByText('contentChangedReload')).toBeInTheDocument();
    expect(alert).toHaveBeenCalledWith('contentChangedReload');
    expect(onBack).not.toHaveBeenCalled();
  },
);

it.each([convexArtifactToRaw, convexExhibitionToRaw])('normalizes legacy converter revisions', convert => {
  expect(convert(fixture()).revision).toBe(0);
  expect(convert(fixture()).documentId).toBe('object');
  expect(convert(fixture(7)).revision).toBe(7);
});

it('submits no expected revision for a new draft', async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ result: 'created' })));
  render(<ArtifactEditor id="new" onBack={vi.fn()} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
  expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).args).not.toHaveProperty('expectedRevision');
  expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).args).not.toHaveProperty('expectedDocumentId');
});
