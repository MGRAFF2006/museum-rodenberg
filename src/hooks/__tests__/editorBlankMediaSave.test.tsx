import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useEditorForm, type EditorConfig } from '../useEditorForm';

const save = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('convex/react', () => ({ useMutation: () => save }));
vi.mock('../useContentData', () => ({ useContentData: () => ({ refreshData: vi.fn() }) }));
vi.mock('../useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../useContentTranslation', () => ({ useContentTranslation: () => ({ isTranslating: false, translationProgress: null, translateFields: vi.fn() }) }));
vi.mock('../useAssetValidation', () => ({ useAssetValidation: () => ({ isValidating: false, validationErrors: [], validateAssets: vi.fn().mockResolvedValue(true), setValidationErrors: vi.fn() }) }));

const config: EditorConfig = {
  contentType: 'artifact', id: 'new', onBack: vi.fn(), initialTranslationFields: { title: '', description: '' },
  defaultEnabledAttributes: [], contentMediaFields: ['description'], getFieldsToTranslate: () => [],
  loadEntity: () => undefined, deleteConfirmKey: 'delete',
};
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it.each(['artifact', 'exhibition'] as const)('saves only completed %s media rows with contiguous ordering', async contentType => {
  const { result } = renderHook(() => useEditorForm({ ...config, contentType }));
  act(() => {
    result.current.handleChange('id', 'item');
    result.current.addMediaItem('images');
    result.current.addMediaItem('videos');
    result.current.addMediaItem('audio');
  });
  act(() => result.current.handleMediaChange('videos', 0, 'url', 'film'));
  await act(() => result.current.handleSave());
  expect(save).toHaveBeenCalledWith(expect.objectContaining({
    mediaItems: [{ mediaType: 'video', url: 'film', sortOrder: 0 }],
  }));
});
