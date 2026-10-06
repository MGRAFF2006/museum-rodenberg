import { act, renderHook } from '@testing-library/react';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorForm, type EditorConfig } from '../useEditorForm';
import type { EntityRecord } from '../../types';

const mocks = vi.hoisted(() => ({
  saveArtifact: vi.fn().mockResolvedValue('saved'),
  saveExhibition: vi.fn().mockResolvedValue('saved'),
  refreshData: vi.fn(),
  validateAssets: vi.fn().mockResolvedValue(true),
  setValidationErrors: vi.fn(),
  t: (key: string) => key,
}));
vi.mock('../useProtectedMutation', () => ({ useProtectedMutation: (mutation: Parameters<typeof getFunctionName>[0]) =>
  getFunctionName(mutation) === 'artifacts:save' ? mocks.saveArtifact : mocks.saveExhibition }));
vi.mock('../useContentData', () => ({ useContentData: () => ({ refreshData: mocks.refreshData }) }));
vi.mock('../useLanguage', () => ({ useLanguage: () => ({ t: mocks.t }) }));
vi.mock('../useContentTranslation', () => ({ useContentTranslation: () => ({ isTranslating: false, translationProgress: null, translateFields: vi.fn() }) }));
vi.mock('../useAssetValidation', () => ({ useAssetValidation: () => ({ isValidating: false, validationErrors: [], validateAssets: mocks.validateAssets, setValidationErrors: mocks.setValidationErrors }) }));
beforeEach(() => vi.clearAllMocks());

function setup(contentType: 'artifact' | 'exhibition', id: string) {
  const entity: EntityRecord = { id: 'existing', translations: {
    de: { title: 'Titel', description: '', subtitle: 'Old subtitle', period: '1900', artist: 'Artist', significance: 'Significant' },
    fr: { title: 'Titre', description: 'Texte' },
  }, detailedContent: { de: 'Old details' }, exhibition: 'parent', dimensions: '10 cm', provenance: 'Owner',
  dateRange: '1900', location: 'Room', curator: 'Curator', organizer: 'Organizer', sponsor: 'Sponsor' };
  const config: EditorConfig = {
    contentType, id, onBack: vi.fn(), initialTranslationFields: { title: '', description: '' },
    defaultEnabledAttributes: [], contentMediaFields: ['description'], getFieldsToTranslate: () => [],
    loadEntity: () => entity, deleteConfirmKey: 'delete',
  };
  const compatibleConfig = { ...config, entity };
  return renderHook(() => useEditorForm(compatibleConfig));
}

describe.each(['artifact', 'exhibition'] as const)('%s editor save payload', contentType => {
  it('uses full-language replacement and explicit cleared strings without marking edits as creation', async () => {
    const { result } = setup(contentType, 'existing');
    await act(async () => result.current.setFormData(previous => ({ ...previous,
      dimensions: '', provenance: '', exhibition: '', dateRange: '', location: '', curator: '', organizer: '', sponsor: '',
      translations: { de: { title: 'Titel', description: '', subtitle: '', period: '', artist: '', significance: '' }, fr: { title: '', description: '' } },
      detailedContent: { de: '' },
    })));
    await act(async () => result.current.handleSave());
    const write = contentType === 'artifact' ? mocks.saveArtifact : mocks.saveExhibition;
    expect(write).toHaveBeenCalledOnce();
    const payload = JSON.parse(JSON.stringify(write.mock.calls[0][0]));
    expect(payload).toMatchObject({ slug: 'existing', createOnly: false, replaceTranslations: true });
    expect(payload.translations).toHaveLength(1);
    expect(payload.translations[0]).toMatchObject({ language: 'de', title: 'Titel', detailedContent: '' });
    if (contentType === 'artifact') {
      expect(payload).toMatchObject({ exhibitionSlug: '', dimensions: '', provenance: '' });
      expect(payload.translations[0]).toMatchObject({ period: '', artist: '', significance: '' });
    } else {
      expect(payload).toMatchObject({ dateRange: '', location: '', curator: '', organizer: '', sponsor: '' });
      expect(payload.translations[0].subtitle).toBe('');
    }
  });

  it('marks a new editor submission as create-only', async () => {
    const { result } = setup(contentType, 'new');
    await act(async () => result.current.setFormData(previous => ({ ...previous, id: 'new-item',
      translations: { de: { title: 'Titel', description: '' } } })));
    await act(async () => result.current.handleSave());
    const write = contentType === 'artifact' ? mocks.saveArtifact : mocks.saveExhibition;
    expect(write.mock.calls[0][0]).toMatchObject({ slug: 'new-item', createOnly: true, replaceTranslations: true });
  });
});
