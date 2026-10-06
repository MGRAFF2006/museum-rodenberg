import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGES, useEditorForm, type EditorConfig } from '../useEditorForm';
import { ArtifactEditor } from '../../components/Admin/ArtifactEditor';
import { ExhibitionEditor } from '../../components/Admin/ExhibitionEditor';
import { convexArtifactToRaw, convexExhibitionToRaw, type ConvexArtifact, type ConvexExhibition } from '../../utils/convexConverters';
import type { EntityRecord } from '../../types';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  translating: false,
  save: vi.fn().mockResolvedValue(undefined),
  validate: vi.fn().mockResolvedValue(true),
  onBack: vi.fn(),
}));
vi.mock('convex/react', () => ({ useQuery: mocks.query, useMutation: () => mocks.save }));
vi.mock('../../utils/auth', () => ({ authFetch: async (input: RequestInfo | URL, init?: RequestInit) => {
  expect(input).toBe('/api/content-write');
  const body = JSON.parse(String(init?.body));
  expect(['artifacts:save', 'exhibitions:save']).toContain(body.operation);
  const result = await mocks.save(body.args);
  return new Response(JSON.stringify({ result }));
} }));
vi.mock('../useContentData', () => ({ useContentData: () => ({
  refreshData: () => {},
  exhibitions: [{ id: 'first', title: 'Partial visitor exhibition' }],
  artifacts: [{ id: 'first', title: 'Partial visitor artifact' }],
}) }));
vi.mock('../useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../useContentTranslation', () => ({ useContentTranslation: () => ({ isTranslating: mocks.translating, translationProgress: { current: 0, total: 0 }, translateFields: vi.fn() }) }));
vi.mock('../useAssetValidation', () => ({ useAssetValidation: () => ({ isValidating: false, validationErrors: [], validateAssets: mocks.validate, setValidationErrors: vi.fn() }) }));
vi.mock('../../components/Admin/AssetSelector', () => ({ AssetSelector: () => null }));
vi.mock('../../components/Admin/VisualEditor', () => ({ VisualEditor: ({ content }: { content: string }) => <textarea readOnly value={content} /> }));

function fixture(slug: string): ConvexExhibition & ConvexArtifact {
  return {
    _id: slug, slug, qrCode: `qr-${slug}`, image: 'thumbnail',
    isFeatured: true, artifactSlugs: ['artifact'],
    enabledAttributes: ['description', 'detailedContent'],
    translations: LANGUAGES.map(language => ({
      language, title: `${slug}-${language}`, description: `![Photo](content-${slug})`,
      detailedContent: `Details ${slug}-${language}`,
    })),
    media: [
      { mediaType: 'image', url: `content-${slug}`, sortOrder: 0 },
      { mediaType: 'image', url: `manual-${slug}`, sortOrder: 1 },
      { mediaType: 'video', url: `video-${slug}`, title: 'Film', description: 'Film description', sortOrder: 2 },
      { mediaType: 'audio', url: `audio-${slug}`, title: 'Sound', description: 'Sound description', sortOrder: 3 },
    ],
  };
}

const baseConfig: EditorConfig = {
  contentType: 'artifact', id: 'first', entity: undefined, onBack: mocks.onBack,
  initialTranslationFields: { title: '', description: '' },
  defaultEnabledAttributes: ['description'], contentMediaFields: ['description'],
  getFieldsToTranslate: () => [], deleteConfirmKey: 'deleteArtifactConfirm',
};

beforeEach(() => { mocks.translating = false; vi.clearAllMocks(); mocks.query.mockReturnValue(undefined); });
afterEach(cleanup);

describe('useEditorForm hydration', () => {
  it('loads complete raw data when it arrives, preserving later drafts and resetting on ID changes', async () => {
    const { result, rerender } = renderHook((config: EditorConfig) => useEditorForm(config), { initialProps: baseConfig });
    expect(result.current.isReady).toBe(false);
    await act(() => result.current.handleSave());
    expect(mocks.validate).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();

    const first = convexArtifactToRaw(fixture('first')) as EntityRecord;
    rerender({ ...baseConfig, entity: first });
    expect(result.current.isReady).toBe(true);
    expect(result.current.formData.translations).toEqual(first.translations);
    expect(result.current.formData.detailedContent).toEqual(first.detailedContent);
    expect(result.current.formData.media).toEqual(first.media);
    act(() => {
      result.current.handleTranslationChange('en', 'title', 'Unsaved draft');
      result.current.handleDetailedContentChange('en', 'Unsaved details');
      result.current.handleMediaChange('videos', 0, 'description', 'Unsaved media');
    });
    rerender({ ...baseConfig, entity: convexArtifactToRaw(fixture('first')) as EntityRecord });
    expect(result.current.formData.translations?.en.title).toBe('Unsaved draft');
    expect(result.current.formData.detailedContent?.en).toBe('Unsaved details');
    expect(result.current.formData.media?.videos[0].description).toBe('Unsaved media');

    rerender({ ...baseConfig, id: 'second', entity: first });
    expect(result.current.isReady).toBe(false);
    expect(result.current.formData.id).toBeUndefined();
    rerender({ ...baseConfig, id: 'second', entity: undefined });
    expect(result.current.isReady).toBe(false);
    expect(result.current.formData.id).toBeUndefined();
    expect(result.current.formData.media?.images).toEqual([]);
    await act(() => result.current.handleSave());
    expect(mocks.save).not.toHaveBeenCalled();
    const second = convexArtifactToRaw(fixture('second')) as EntityRecord;
    rerender({ ...baseConfig, id: 'second', entity: second });
    expect(result.current.formData.id).toBe('second');
    expect(result.current.formData.translations).toEqual(second.translations);
    expect(result.current.formData.media).toEqual(second.media);

    rerender({ ...baseConfig, entity: first });
    expect(result.current.formData.translations?.en.title).toBe('first-en');
    rerender({ ...baseConfig, id: 'new', entity: undefined });
    expect(result.current.isReady).toBe(true);
    expect(result.current.formData.id).toBeUndefined();
    expect(result.current.formData.translations?.en.title).toBe('');
  });

  it('blocks missing records, including one deleted after hydration', async () => {
    const { result, rerender } = renderHook((config: EditorConfig) => useEditorForm(config), { initialProps: { ...baseConfig, entity: null } as EditorConfig });
    expect(result.current.isNotFound).toBe(true);
    await act(() => result.current.handleSave());
    expect(mocks.save).not.toHaveBeenCalled();
    rerender({ ...baseConfig, entity: convexArtifactToRaw(fixture('first')) as EntityRecord });
    expect(result.current.isReady).toBe(true);
    rerender({ ...baseConfig, entity: null });
    expect(result.current.isReady).toBe(false);
    await act(() => result.current.handleSave());
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('initializes new forms immediately and saves without a query result', async () => {
    const { result } = renderHook(() => useEditorForm({ ...baseConfig, id: 'new' }));
    expect(result.current.isReady).toBe(true);
    expect(result.current.formData.enabledAttributes).toEqual(baseConfig.defaultEnabledAttributes);
    act(() => {
      result.current.handleChange('id', 'created');
      result.current.handleTranslationChange('de', 'title', 'New artifact');
    });
    await act(() => result.current.handleSave());
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'created', translations: [expect.objectContaining({ language: 'de', title: 'New artifact' })] }));
    expect(mocks.onBack).toHaveBeenCalledWith(true);
  });
});

for (const [name, Editor] of [['artifact', ArtifactEditor], ['exhibition', ExhibitionEditor]] as const) {
  describe(`${name} editor integration`, () => {
    it('ignores partial visitor context, disables Save until the query arrives, and saves complete translations/media', async () => {
      const { rerender } = render(<Editor id="first" onBack={mocks.onBack} />);
      expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByDisplayValue(`Partial visitor ${name}`)).not.toBeInTheDocument();
      mocks.query.mockReturnValue(fixture('first'));
      rerender(<Editor id="first" onBack={mocks.onBack} />);
      expect(screen.getByRole('button', { name: 'save' })).toBeEnabled();
      expect(screen.getByDisplayValue('first-de')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'EN' }));
      expect(screen.getByDisplayValue('first-en')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Details first-en')).toBeInTheDocument();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'save' })); });
      expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
        slug: 'first',
        translations: LANGUAGES.map(language => expect.objectContaining({ language, title: `first-${language}`, detailedContent: `Details first-${language}` })),
        mediaItems: fixture('first').media,
        ...(name === 'exhibition' ? { isFeatured: true } : {}),
      }));
    });

    it('exposes not-found rather than an editable empty form', () => {
      mocks.query.mockReturnValue(null);
      render(<Editor id="first" onBack={mocks.onBack} />);
      expect(screen.getByRole('status')).toHaveTextContent(`${name}NotFound`);
      expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });
}

it.each([true, false])('preserves exhibition isFeatured=%s in raw editor data', isFeatured => {
  expect(convexExhibitionToRaw({ ...fixture('first'), isFeatured }).isFeatured).toBe(isFeatured);
});

 it('prevents saving a draft while translation is still running', async () => {
  mocks.translating = true;
  const { result, rerender } = renderHook(() => useEditorForm({ ...baseConfig, id: 'new' }));
  await act(() => result.current.handleSave());
  expect(mocks.validate).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
  mocks.translating = false;
  rerender();
  await act(() => result.current.handleSave());
  expect(mocks.validate).toHaveBeenCalledOnce();
  expect(mocks.save).toHaveBeenCalledOnce();
});
