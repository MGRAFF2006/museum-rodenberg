import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArtifactEditor } from '../ArtifactEditor';
import { ExhibitionEditor } from '../ExhibitionEditor';

const mocks = vi.hoisted(() => ({ query: vi.fn(), save: vi.fn().mockResolvedValue(undefined) }));
vi.mock('convex/react', () => ({ useQuery: mocks.query, useMutation: () => mocks.save }));
vi.mock('../../../hooks/useProtectedMutation', () => ({ useProtectedMutation: () => mocks.save }));
vi.mock('../../../hooks/useContentData', () => ({ useContentData: () => ({ exhibitions: [], artifacts: [], refreshData: vi.fn() }) }));
vi.mock('../../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../../hooks/useContentTranslation', () => ({ useContentTranslation: () => ({
  isTranslating: false, translationProgress: { current: 0, total: 0 }, translateFields: vi.fn(),
}) }));
vi.mock('../../../hooks/useAssetValidation', () => ({ useAssetValidation: () => ({
  isValidating: false, validationErrors: [], setValidationErrors: vi.fn(), validateAssets: async () => true,
}) }));
vi.mock('../AssetSelector', () => ({ AssetSelector: () => null }));
vi.mock('../VisualEditor', () => ({ VisualEditor: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockReturnValue({
    _id: 'object', slug: 'object', qrCode: 'qr', image: '', isFeatured: false, artifactSlugs: [], media: [],
    enabledAttributes: ['materials', 'tags'], materials: ['paper'], tags: ['history'],
    translations: [{ language: 'de', title: 'Object', description: 'Story' }],
  });
});
afterEach(cleanup);

describe('array metadata controls', () => {
  it.each([['artifact', ArtifactEditor], ['exhibition', ExhibitionEditor]] as const)(
    'edits and clears %s tags with one item per line', async (_type, Editor) => {
      render(<Editor id="object" onBack={vi.fn()} />);
      const tags = screen.getByRole('textbox', { name: 'tags' });
      expect(tags).toHaveValue('history');
      fireEvent.change(tags, { target: { value: ' regional history \n\n school, groups \n' } });
      expect(tags).toHaveValue(' regional history \n\n school, groups \n');
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
      expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ['regional history', 'school, groups'] }));
      fireEvent.change(tags, { target: { value: '' } });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
      expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ tags: [] }));
    },
  );

  it('edits and clears artifact materials without splitting commas inside a value', async () => {
    render(<ArtifactEditor id="object" onBack={vi.fn()} />);
    const materials = screen.getByRole('textbox', { name: 'materials' });
    expect(materials).toHaveValue('paper');
    fireEvent.change(materials, { target: { value: ' wood \n cotton, linen \n' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
    expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ materials: ['wood', 'cotton, linen'] }));
    fireEvent.change(materials, { target: { value: '' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
    expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ materials: [] }));
  });
});
