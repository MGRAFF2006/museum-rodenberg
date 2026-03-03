import React, { useCallback } from 'react';
import { useContentData } from '../../hooks/useContentData';
import { useLanguage } from '../../hooks/useLanguage';
import { useEditorForm, TranslatableField } from '../../hooks/useEditorForm';
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

interface ArtifactEditorProps {
  id: string;
  onBack: (saved?: boolean) => void;
}

const INITIAL_TRANSLATION_FIELDS = {
  title: '', description: '', significance: '', period: '', provenance: '', dimensions: '', artist: '',
};

const DEFAULT_ENABLED = ['title', 'description', 'period', 'dimensions', 'materials', 'provenance', 'significance'];

export const ArtifactEditor: React.FC<ArtifactEditorProps> = ({ id, onBack }) => {
  const { getArtifactById, exhibitions } = useContentData();
  const { t } = useLanguage();

  const getFieldsToTranslate = useCallback((formData: Record<string, any>): TranslatableField[] => {
    const de = formData.translations?.de || {};
    return [
      { key: 'title', text: de.title || '', type: 'translation', isMarkdown: false },
      { key: 'description', text: de.description || '', type: 'translation', isMarkdown: true },
      { key: 'significance', text: de.significance || '', type: 'translation', isMarkdown: true },
      { key: 'artist', text: de.artist || '', type: 'translation', isMarkdown: false },
      { key: 'period', text: de.period || '', type: 'translation', isMarkdown: false },
      { key: 'provenance', text: de.provenance || '', type: 'translation', isMarkdown: false },
      { key: 'dimensions', text: de.dimensions || '', type: 'translation', isMarkdown: false },
      { key: 'detailed', text: formData.detailedContent?.de || '', type: 'detailed', isMarkdown: true },
    ].filter(f => f.text) as TranslatableField[];
  }, []);

  const editor = useEditorForm({
    contentType: 'artifact',
    id,
    onBack,
    initialTranslationFields: INITIAL_TRANSLATION_FIELDS,
    defaultEnabledAttributes: DEFAULT_ENABLED,
    contentMediaFields: ['description', 'significance'],
    getFieldsToTranslate,
    loadEntity: getArtifactById,
    deleteConfirmKey: 'deleteArtifactConfirm',
  });

  const {
    formData, activeLang, setActiveLang, contentMedia,
    isTranslating, translationProgress,
    isValidating, validationErrors, setValidationErrors,
    handleChange, handleMediaChange, addMediaItem, removeMediaItem,
    handleTranslationChange, handleDetailedContentChange,
    handleTranslate, handleTranslateAll, handleSave, handleDelete,
  } = editor;

  const ATTRIBUTES = [
    { id: 'artist', label: t('artistCreator') },
    { id: 'period', label: t('period') },
    { id: 'dimensions', label: t('dimensions') },
    { id: 'materials', label: t('materials') },
    { id: 'provenance', label: t('provenance') },
    { id: 'significance', label: t('historicalSignificance') },
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
        onSave={handleSave} t={t}
      />

      <TranslationProgress isTranslating={isTranslating} progress={translationProgress} t={t} />
      <ValidationBanners isValidating={isValidating} validationErrors={validationErrors} setValidationErrors={setValidationErrors} t={t} />

      <div className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 border-b pb-4">
          {id === 'new' ? t('addArtifact') : t('edit') + ': ' + formData.title}
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
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('qrCodeKey')}</label>
            <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.qrCode || ''} onChange={(e) => handleChange('qrCode', e.target.value)} />
          </div>
          {formData.enabledAttributes?.includes('artist') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('artistCreator')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.artist || ''} onChange={(e) => handleChange('artist', e.target.value)} />
            </div>
          )}
          <div className="md:col-span-2">
            <AssetSelector label={t('thumbnailImage')} value={formData.image || ''} onChange={(url) => handleChange('image', url)} assetType="image" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('exhibitions')}</label>
            <select className="input w-full px-3 py-2 border rounded-md" value={formData.exhibition || ''} onChange={(e) => handleChange('exhibition', e.target.value)}>
              <option value="">{t('none')}</option>
              {exhibitions.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title}</option>
              ))}
            </select>
          </div>
          {formData.enabledAttributes?.includes('dimensions') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('dimensions')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.dimensions || ''} onChange={(e) => handleChange('dimensions', e.target.value)} />
            </div>
          )}
          {formData.enabledAttributes?.includes('provenance') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('provenance')}</label>
              <input type="text" className="input w-full px-3 py-2 border rounded-md" value={formData.provenance || ''} onChange={(e) => handleChange('provenance', e.target.value)} />
            </div>
          )}
        </div>

        <MediaSection
          formData={formData} contentMedia={contentMedia} addLabel={t('addArtifact')}
          onAdd={addMediaItem} onRemove={removeMediaItem} onChange={handleMediaChange} t={t}
        />

        {/* Translations */}
        <div className="mt-8">
          <LanguageTabs activeLang={activeLang} onTabChange={setActiveLang} />
          <div className="space-y-4">
            <TranslatableTextField label={t('title')} lang={activeLang} value={formData.translations?.[activeLang]?.title || ''} onChange={(v) => handleTranslationChange(activeLang, 'title', v)} />
            {formData.enabledAttributes?.includes('artist') && (
              <TranslatableTextField label={t('artistCreator')} lang={activeLang} value={formData.translations?.[activeLang]?.artist || ''} onChange={(v) => handleTranslationChange(activeLang, 'artist', v)} />
            )}
            {formData.enabledAttributes?.includes('period') && (
              <TranslatableTextField label={t('period')} lang={activeLang} value={formData.translations?.[activeLang]?.period || ''} onChange={(v) => handleTranslationChange(activeLang, 'period', v)} />
            )}
            {formData.enabledAttributes?.includes('dimensions') && (
              <TranslatableTextField label={t('dimensions')} lang={activeLang} value={formData.translations?.[activeLang]?.dimensions || ''} onChange={(v) => handleTranslationChange(activeLang, 'dimensions', v)} />
            )}
            {formData.enabledAttributes?.includes('provenance') && (
              <TranslatableTextField label={t('provenance')} lang={activeLang} value={formData.translations?.[activeLang]?.provenance || ''} onChange={(v) => handleTranslationChange(activeLang, 'provenance', v)} />
            )}
            <TranslatableMarkdownField id={id} label={t('description')} lang={activeLang} value={formData.translations?.[activeLang]?.description || ''} onChange={(v) => handleTranslationChange(activeLang, 'description', v)} editorKeySuffix="description" />
            {formData.enabledAttributes?.includes('significance') && (
              <TranslatableMarkdownField id={id} label={t('historicalSignificance')} lang={activeLang} value={formData.translations?.[activeLang]?.significance || ''} onChange={(v) => handleTranslationChange(activeLang, 'significance', v)} editorKeySuffix="significance" />
            )}
            {formData.enabledAttributes?.includes('detailedContent') && (
              <TranslatableMarkdownField id={id} label={t('details')} lang={activeLang} value={formData.detailedContent?.[activeLang] || ''} onChange={(v) => handleDetailedContentChange(activeLang, v)} editorKeySuffix="detailed" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
