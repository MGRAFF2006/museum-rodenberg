import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArtifactEditor } from '../ArtifactEditor';
import { ExhibitionEditor } from '../ExhibitionEditor';

const mocks = vi.hoisted(() => ({
  query: vi.fn(), save: vi.fn().mockResolvedValue(undefined), translate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('convex/react', () => ({ useQuery: mocks.query, useMutation: () => mocks.save }));
vi.mock('../../../hooks/useContentData', () => ({ useContentData: () => ({ exhibitions: [], artifacts: [], refreshData: vi.fn() }) }));
vi.mock('../../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../../hooks/useContentTranslation', () => ({ useContentTranslation: () => ({
  isTranslating: false, translationProgress: { current: 0, total: 0 }, translateFields: mocks.translate,
}) }));
vi.mock('../../../hooks/useAssetValidation', () => ({ useAssetValidation: () => ({
  isValidating: false, validationErrors: [], setValidationErrors: vi.fn(), validateAssets: async () => true,
}) }));
vi.mock('../AssetSelector', () => ({ AssetSelector: () => null }));
vi.mock('../VisualEditor', () => ({ VisualEditor: ({ content }: { content: string }) => <textarea readOnly value={content} /> }));

function fixture() {
  return {
    _id: 'object', slug: 'object', qrCode: 'qr', image: '', isFeatured: false, artifactSlugs: [], media: [],
    dateRange: 'Dates', location: 'Location', curator: 'Curator', organizer: 'Organizer', sponsor: 'Sponsor',
    dimensions: 'Dimensions', provenance: 'Provenance',
    enabledAttributes: ['title', 'description', 'dateRange', 'location', 'curator', 'organizer', 'sponsor', 'artist', 'dimensions', 'provenance'],
    translations: ['de', 'en'].map(language => ({ language, title: `${language} title`, description: 'Story', artist: `${language} artist` })),
  };
}

beforeEach(() => { vi.clearAllMocks(); mocks.query.mockReturnValue(fixture()); });
afterEach(cleanup);

describe('metadata controls follow the persisted schema', () => {
  it('edits exhibition metadata globally and keeps it when changing language', async () => {
    render(<ExhibitionEditor id="object" onBack={vi.fn()} />);
    for (const field of ['period', 'location', 'curator', 'organizer', 'sponsor']) {
      expect(screen.queryByText(`${field} (de)`)).not.toBeInTheDocument();
    }
    fireEvent.change(screen.getByRole('textbox', { name: 'curator' }), { target: { value: 'Updated curator' } });
    fireEvent.change(screen.getByDisplayValue('Location'), { target: { value: 'Updated location' } });
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('textbox', { name: 'curator' })).toHaveValue('Updated curator');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      curator: 'Updated curator', location: 'Updated location', dateRange: 'Dates', organizer: 'Organizer', sponsor: 'Sponsor',
      translations: [
        expect.objectContaining({ language: 'de', title: 'de title' }),
        expect.objectContaining({ language: 'en', title: 'en title' }),
      ],
    }));
  });

  it('keeps artifact dimensions/provenance global and artist translated', async () => {
    render(<ArtifactEditor id="object" onBack={vi.fn()} />);
    expect(screen.getAllByText(/artistCreator/)).toHaveLength(2); // Visibility checkbox and one translated field.
    expect(screen.queryByText('dimensions (de)')).not.toBeInTheDocument();
    expect(screen.queryByText('provenance (de)')).not.toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('Dimensions'), { target: { value: 'Updated dimensions' } });
    fireEvent.change(screen.getByDisplayValue('Provenance'), { target: { value: 'Updated provenance' } });
    fireEvent.change(screen.getByDisplayValue('de artist'), { target: { value: 'Updated German artist' } });
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByDisplayValue('Updated dimensions')).toBeInTheDocument();
    expect(screen.getByDisplayValue('en artist')).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      dimensions: 'Updated dimensions', provenance: 'Updated provenance',
      translations: [
        expect.objectContaining({ language: 'de', artist: 'Updated German artist' }),
        expect.objectContaining({ language: 'en', artist: 'en artist' }),
      ],
    }));
  });

  it.each([['exhibition', ExhibitionEditor], ['artifact', ArtifactEditor]] as const)(
    'only requests translation of persisted %s translation fields', async (type, Editor) => {
      render(<Editor id="object" onBack={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'EN' }));
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'translate' })); });
      const keys = mocks.translate.mock.calls[0][0].map((field: { key: string }) => field.key);
      expect(keys).toEqual(type === 'artifact' ? ['title', 'description', 'artist'] : ['title', 'description']);
    },
  );
});
