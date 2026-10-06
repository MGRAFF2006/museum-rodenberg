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

function setup(contentType: 'artifact' | 'exhibition', id: string, source?: EntityRecord) {
  const entity: EntityRecord = source || { id: 'existing', translations: {
    de: { title: 'Titel', description: '', subtitle: 'Old subtitle', period: '1900', artist: 'Artist', significance: 'Significant' },
    fr: { title: 'Titre', description: 'Texte' },
  }, detailedContent: { de: 'Old details' }, exhibition: 'parent', dimensions: '10 cm', provenance: 'Owner',
  dateRange: '1900', location: 'Room', curator: 'Curator', organizer: 'Organizer', sponsor: 'Sponsor' };
  const config: EditorConfig = {
    contentType, id, onBack: vi.fn(), initialTranslationFields: { title: '', description: '' },
    defaultEnabledAttributes: [], contentMediaFields: ['description'], getFieldsToTranslate: () => [],
    entity, deleteConfirmKey: 'delete',
  };
  const compatibleConfig = { ...config, entity };
  return renderHook(() => useEditorForm(compatibleConfig));
}

describe.each(['artifact', 'exhibition'] as const)('%s editor save payload', contentType => {
  it('removes deliberately cleared languages and saves explicit cleared strings without marking edits as creation', async () => {
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
    expect(payload).toMatchObject({ slug: 'existing', createOnly: false, removeLanguages: ['fr'] });
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
    expect(write.mock.calls[0][0]).toMatchObject({ slug: 'new-item', createOnly: true, removeLanguages: [] });
  });

  it('preserves optional translation values and unseen languages when loaded from partial data', async () => {
    const { result } = setup(contentType, 'existing', {
      id: 'existing', translations: { de: { title: 'Titel', description: 'Text' } },
    });
    await act(async () => result.current.handleSave());
    const write = contentType === 'artifact' ? mocks.saveArtifact : mocks.saveExhibition;
    const payload = JSON.parse(JSON.stringify(write.mock.calls[0][0]));
    expect(payload.removeLanguages).toEqual([]);
    expect(payload).not.toHaveProperty('replaceTranslations');
    expect(payload.translations[0]).toEqual({ language: 'de', title: 'Titel', description: 'Text' });

    await act(async () => result.current.handleDetailedContentChange('de', ''));
    await act(async () => result.current.handleSave());
    expect(write.mock.calls[1][0].translations[0].detailedContent).toBe('');
  });
});


describe.each(['artifact', 'exhibition'] as const)('%s asynchronous save ownership', contentType => {
  function mount() {
    const config: EditorConfig = {
      contentType, id: 'existing', entity: undefined, onBack: vi.fn(),
      initialTranslationFields: { title: '', description: '' }, defaultEnabledAttributes: [],
      contentMediaFields: ['description'], getFieldsToTranslate: () => [], deleteConfirmKey: 'delete',
    };
    return renderHook((entity: EntityRecord | undefined) => useEditorForm({ ...config, entity }), {
      initialProps: undefined as EntityRecord | undefined,
    });
  }

  it('captures loaded languages and version when the full record arrives, then preserves draft ownership', async () => {
    const { result, rerender } = mount();
    expect(result.current.isReady).toBe(false);
    rerender({ id: 'existing', documentId: 'original-id', revision: 3,
      translations: { de: { title: 'Titel', description: 'Text' }, fr: { title: 'Titre', description: 'Texte' } },
      detailedContent: { de: 'German details', fr: 'French details' },
    });
    act(() => result.current.handleTranslationChange('fr', 'title', ''));
    rerender({ id: 'existing', documentId: 'replacement-id', revision: 9,
      translations: { de: { title: 'Remote title', description: 'Remote text' }, it: { title: 'Titolo', description: '' } },
    });
    await act(async () => result.current.handleSave());
    const write = contentType === 'artifact' ? mocks.saveArtifact : mocks.saveExhibition;
    const payload = JSON.parse(JSON.stringify(write.mock.calls[0][0]));
    expect(payload).toMatchObject({ expectedDocumentId: 'original-id', expectedRevision: 3, removeLanguages: ['fr'] });
    expect(payload.translations).toEqual([expect.objectContaining({ language: 'de', title: 'Titel', detailedContent: 'German details' })]);
    expect(payload).not.toHaveProperty('replaceTranslations');
  });

  it('keeps unseen languages and details outside a partial accepted record out of the clearing payload', async () => {
    const { result, rerender } = mount();
    rerender({ id: 'existing', documentId: 'original-id', revision: 3,
      translations: { de: { title: 'Titel', description: 'Text' } },
    });
    act(() => result.current.handleTranslationChange('de', 'title', 'Edited title'));
    await act(async () => result.current.handleSave());
    const write = contentType === 'artifact' ? mocks.saveArtifact : mocks.saveExhibition;
    const payload = JSON.parse(JSON.stringify(write.mock.calls[0][0]));
    expect(payload).toMatchObject({ expectedDocumentId: 'original-id', expectedRevision: 3, removeLanguages: [] });
    expect(payload.translations).toEqual([{ language: 'de', title: 'Edited title', description: 'Text' }]);
    expect(payload).not.toHaveProperty('replaceTranslations');
  });
});
