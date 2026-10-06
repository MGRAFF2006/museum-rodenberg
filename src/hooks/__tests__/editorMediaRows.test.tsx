import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useEditorForm, type EditorConfig } from '../useEditorForm';
vi.mock('convex/react', () => ({ useMutation: () => vi.fn() }));
vi.mock('../useContentData', () => ({ useContentData: () => ({ refreshData: vi.fn() }) }));
vi.mock('../useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../useContentTranslation', () => ({ useContentTranslation: () => ({ isTranslating: false, translationProgress: { current: 0, total: 0 }, translateFields: vi.fn() }) }));
vi.mock('../useAssetValidation', () => ({ useAssetValidation: () => ({ isValidating: false, validationErrors: [], validateAssets: vi.fn(), setValidationErrors: vi.fn() }) }));
const config: EditorConfig = { contentType: 'artifact', id: 'new', onBack: vi.fn(), initialTranslationFields: { title: '', description: '' }, defaultEnabledAttributes: ['title', 'description'], contentMediaFields: ['description'], getFieldsToTranslate: () => [], loadEntity: () => undefined, deleteConfirmKey: 'delete' };
afterEach(cleanup);
it('selects a URL in a newly added empty image row', () => {
  const { result } = renderHook(() => useEditorForm(config));
  act(() => result.current.addMediaItem('images'));
  expect(result.current.formData.media?.images).toEqual(['']);
  act(() => result.current.handleMediaChange('images', 0, 'url', 'asset-id'));
  expect(result.current.formData.media?.images).toEqual(['asset-id']);
});
it('removes an empty image row', () => {
  const { result } = renderHook(() => useEditorForm(config));
  act(() => result.current.addMediaItem('images'));
  act(() => result.current.removeMediaItem('images', 0));
  expect(result.current.formData.media?.images).toEqual([]);
});
it('ignores an invalid row index without changing existing media', () => {
  const { result } = renderHook(() => useEditorForm(config));
  act(() => result.current.addMediaItem('images'));
  act(() => result.current.handleMediaChange('images', -1, 'url', 'asset-id'));
  act(() => result.current.removeMediaItem('images', 3));
  expect(result.current.formData.media?.images).toEqual(['']);
});
