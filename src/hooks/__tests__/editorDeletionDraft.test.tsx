import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ArtifactEditor } from '../../components/Admin/ArtifactEditor';
import { ExhibitionEditor } from '../../components/Admin/ExhibitionEditor';

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

function record(revision?: number, documentId = 'original-document') {
  return { _id: documentId, slug: 'Legacy_Object', revision, qrCode: 'qr', image: '', isFeatured: false,
    artifactSlugs: [], enabledAttributes: [], media: [],
    translations: [{ language: 'de', title: 'Initial title', description: 'Story' }],
  };
}

beforeEach(() => {
  mocks.query.mockReturnValue(record(4));
  mocks.fetch.mockReset();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each([['artifact', ArtifactEditor], ['exhibition', ExhibitionEditor]] as const)(
  'keeps the %s draft and captured identity after a stale delete response', async (type, Editor) => {
    const onBack = vi.fn();
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { rerender } = render(<Editor id="Legacy_Object" onBack={onBack} />);
    fireEvent.change(screen.getByDisplayValue('Initial title'), { target: { value: 'Unsaved curator draft' } });
    mocks.query.mockReturnValue(record(0, 'replacement-document'));
    rerender(<Editor id="Legacy_Object" onBack={onBack} />);
    mocks.fetch.mockResolvedValue(new Response('{}', { status: 409 }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'delete' })); });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ operation: `${type}s:remove`, args: {
      slug: 'Legacy_Object', expectedRevision: 4, expectedDocumentId: 'original-document',
    } });
    expect(screen.getByDisplayValue('Unsaved curator draft')).toBeInTheDocument();
    expect(screen.getByText('contentChangedReload')).toBeInTheDocument();
    expect(alert).toHaveBeenCalledWith('contentChangedReload');
    expect(onBack).not.toHaveBeenCalled();
  },
);

it.each([['artifact', ArtifactEditor], ['exhibition', ExhibitionEditor]] as const)(
  'deletes a matching legacy %s with revision zero, preserving case-sensitive identity', async (type, Editor) => {
    mocks.query.mockReturnValue(record());
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ result: null })));
    const onBack = vi.fn();
    render(<Editor id="Legacy_Object" onBack={onBack} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'delete' })); });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ operation: `${type}s:remove`, args: {
      slug: 'Legacy_Object', expectedRevision: 0, expectedDocumentId: 'original-document',
    } });
    expect(onBack).toHaveBeenCalledWith(true);
  },
);

it('a cancelled confirmation never sends a delete', async () => {
  vi.mocked(window.confirm).mockReturnValue(false);
  render(<ArtifactEditor id="Legacy_Object" onBack={vi.fn()} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'delete' })); });
  expect(mocks.fetch).not.toHaveBeenCalled();
});
