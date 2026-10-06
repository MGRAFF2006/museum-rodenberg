import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useEditorForm, type EditorConfig } from '../useEditorForm';
import type { EntityRecord } from '../../types';

const mocks = vi.hoisted(() => ({ save: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../useProtectedMutation', async () => ({
  ...await vi.importActual('../useProtectedMutation'), useProtectedMutation: () => mocks.save,
}));
vi.mock('../useContentData', () => ({ useContentData: () => ({ refreshData: vi.fn() }) }));
vi.mock('../useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../useContentTranslation', () => ({ useContentTranslation: () => ({ translateFields: vi.fn() }) }));
vi.mock('../useAssetValidation', () => ({ useAssetValidation: () => ({ validateAssets: async () => true, setValidationErrors: vi.fn() }) }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function config(contentType: 'artifact' | 'exhibition', entity: EntityRecord): EditorConfig {
  return { contentType, id: 'object', onBack: vi.fn(), initialTranslationFields: {}, defaultEnabledAttributes: [],
    contentMediaFields: ['description'], getFieldsToTranslate: () => [], loadEntity: () => entity, deleteConfirmKey: '',
  };
}

it.each(['artifact', 'exhibition'] as const)('sends null for intentional %s field clears and preserves unloaded details', async contentType => {
  const entity = { id: 'object', documentId: 'document', revision: 0, location: 'Location', dimensions: 'Size',
    translations: { de: { title: 'Title', description: 'Story', subtitle: 'Subtitle', artist: 'Artist' } },
  };
  const { result } = renderHook(() => useEditorForm(config(contentType, entity)));
  act(() => {
    result.current.handleChange(contentType === 'exhibition' ? 'location' : 'dimensions', '');
    result.current.handleTranslationChange('de', contentType === 'exhibition' ? 'subtitle' : 'artist', '');
  });
  await act(() => result.current.handleSave());
  const first = mocks.save.mock.calls[0][0];
  expect(first[contentType === 'exhibition' ? 'location' : 'dimensions']).toBeNull();
  expect(first.translations[0][contentType === 'exhibition' ? 'subtitle' : 'artist']).toBeNull();
  expect(first.translations[0].detailedContent).toBeUndefined();
  act(() => result.current.handleDetailedContentChange('de', ''));
  await act(() => result.current.handleSave());
  expect(mocks.save.mock.calls[1][0].translations[0].detailedContent).toBeNull();
});
