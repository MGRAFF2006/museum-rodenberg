import React, { useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLanguage } from '../../hooks/useLanguage';
import { EntityRecord } from '../../types';
import { useEditorForm, TranslatableField } from '../../hooks/useEditorForm';
import { convexExhibitionToRaw, type ConvexExhibition } from '../../utils/convexConverters';
import { AssetSelector } from './AssetSelector';
import {
  EditorToolbar,
  TranslationProgress,
  ValidationBanners,
  AttributeCheckboxes,
  MediaSection,
  LanguageTabs,
  TranslatableTextField,
  TranslatableMarkdownField,
} from './EditorShared';

interface ExhibitionEditorProps {
  id: string;
  onBack: (saved?: boolean) => void;
}

const INITIAL_TRANSLATION_FIELDS = {
  title: '', subtitle: '', description: '',
};

const DEFAULT_ENABLED = ['title', 'description', 'subtitle', 'dateRange', 'location', 'curator', 'organizer', 'sponsor', 'tags', 'media', 'detailedContent'];

export const ExhibitionEditor: React.FC<ExhibitionEditorProps> = ({ id, onBack }) => {
  const { t } = useLanguage();

  // Fetch full exhibition data (all languages) directly via getBySlug.
  // ContentContext only has the current language; editors need all translations.
  const fullExhibition = useQuery(
    api.exhibitions.getBySlug,
    id !== 'new' ? { slug: id } : 'skip'
  ) as ConvexExhibition | null | undefined;

  // Convert to legacy raw shape with all translations for the editor form
  const rawExhibition = useMemo(() => {
    if (!fullExhibition) return fullExhibition;
    return convexExhibitionToRaw(fullExhibition) as EntityRecord;
  }, [fullExhibition]);

  const getFieldsToTranslate = useCallback((formData: EntityRecord): TranslatableField[] => {
    const de = formData.translations?.de || {};
    return [
      { key: 'title', text: de.title || '', type: 'translation', isMarkdown: false },
      { key: 'subtitle', text: de.subtitle || '', type: 'translation', isMarkdown: false },
      { key: 'description', text: de.description || '', type: 'translation', isMarkdown: true },
      { key: 'detailed', text: formData.detailedContent?.de || '', type: 'detailed', isMarkdown: true },
    ].filter(f => f.text) as TranslatableField[];
  }, []);

  const editor = useEditorForm({
    contentType: 'exhibition',
    id,
    onBack,
    initialTranslationFields: INITIAL_TRANSLATION_FIELDS,
    defaultEnabledAttributes: DEFAULT_ENABLED,
    contentMediaFields: ['description'],
    getFieldsToTranslate,
    entity: rawExhibition,
    deleteConfirmKey: 'deleteExhibitionConfirm',
  });

  const {
    formData, isReady, isNotFound, activeLang, setActiveLang, contentMedia,
    isTranslating, translationProgress,
    isValidating, validationErrors, setValidationErrors,
    handleChange, handleMediaChange, addMediaItem, removeMediaItem,
    handleTranslationChange, handleDetailedContentChange,
    handleTranslate, handleTranslateAll, handleSave, handleDelete,
  } = editor;

  const ATTRIBUTES = [
    { id: 'subtitle', label: t('museumHeaderSubtitle') },
    { id: 'dateRange', label: t('period') },
    { id: 'location', label: t('location') },
    { id: 'curator', label: t('curator') },
    { id: 'organizer', label: t('organizer') },
    { id: 'sponsor', label: t('sponsor') },
    { id: 'tags', label: t('tags') },
    { id: 'media', label: t('media') },
    { id: 'detailedContent', label: t('details') },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <EditorToolbar
        id={id} activeLang={activeLang} isTranslating={isTranslating}
        onBack={() => onBack()} onDelete={handleDelete}
        onTranslate={handleTranslate} onTranslateAll={handleTranslateAll}
        onSave={handleSave} isReady={isReady} t={t}
      />

      {!isReady ? (
        <p role="status" aria-busy={!isNotFound}>{isNotFound ? t('exhibitionNotFound') : t('edit') + '…'}</p>
      ) : (<>
      <TranslationProgress isTranslating={isTranslating} progress={translationProgress} t={t} />
      <ValidationBanners isValidating={isValidating} validationErrors={validationErrors} setValidationErrors={setValidationErrors} t={t} />

      <div className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 border-b pb-4">
          {id === 'new' ? t('addExhibition') : t('edit') + ': ' + formData.title}
        </h2>

        <AttributeCheckboxes
          attributes={ATTRIBUTES}
          enabledAttributes={formData.enabledAttributes || []}
          onChange={handleChange} t={t}
        />

        {/* Global Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('idSlug')}</label>
            <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.id || ''} onChange={(e) => handleChange('id', e.target.value)} disabled={id !== 'new'} />
          </div>
          <div className="md:col-span-2">
            <AssetSelector label={t('thumbnailImage')} value={formData.image || ''} onChange={(url) => handleChange('image', url)} assetType="image" />
          </div>
          {formData.enabledAttributes?.includes('dateRange') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('period')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.dateRange || ''} onChange={(e) => handleChange('dateRange', e.target.value)} />
            </div>
          )}
          {formData.enabledAttributes?.includes('location') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('location')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} />
            </div>
          )}
          {formData.enabledAttributes?.includes('curator') && (
            <div>
              <label htmlFor="exhibition-curator" className="block text-sm font-medium text-neutral-700 mb-1">{t('curator')}</label>
              <input id="exhibition-curator" type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.curator || ''} onChange={(e) => handleChange('curator', e.target.value)} />
            </div>
          )}
          {formData.enabledAttributes?.includes('organizer') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('organizer')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.organizer || ''} onChange={(e) => handleChange('organizer', e.target.value)} />
            </div>
          )}
          {formData.enabledAttributes?.includes('sponsor') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('sponsor')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.sponsor || ''} onChange={(e) => handleChange('sponsor', e.target.value)} />
            </div>
          )}
        </div>

        <MediaSection
          formData={formData} contentMedia={contentMedia} addLabel={t('addExhibition')}
          onAdd={addMediaItem} onRemove={removeMediaItem} onChange={handleMediaChange} t={t}
        />

        {/* Translations */}
        <div className="mt-8">
          <LanguageTabs activeLang={activeLang} onTabChange={setActiveLang} />
          <div className="space-y-4">
            <TranslatableTextField label={t('title')} lang={activeLang} value={formData.translations?.[activeLang]?.title || ''} onChange={(v) => handleTranslationChange(activeLang, 'title', v)} />
            {formData.enabledAttributes?.includes('subtitle') && (
              <TranslatableTextField label={t('museumHeaderSubtitle')} lang={activeLang} value={formData.translations?.[activeLang]?.subtitle || ''} onChange={(v) => handleTranslationChange(activeLang, 'subtitle', v)} />
            )}
            <TranslatableMarkdownField id={id} label={t('description')} lang={activeLang} value={formData.translations?.[activeLang]?.description || ''} onChange={(v) => handleTranslationChange(activeLang, 'description', v)} editorKeySuffix="description" />
            {formData.enabledAttributes?.includes('detailedContent') && (
              <TranslatableMarkdownField id={id} label={t('details')} lang={activeLang} value={formData.detailedContent?.[activeLang] || ''} onChange={(v) => handleDetailedContentChange(activeLang, v)} editorKeySuffix="detailed" />
            )}
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
};
