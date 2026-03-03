import React from 'react';
import { ArrowLeft, Save, Languages, Loader2, Trash2, Plus, X as CloseIcon, Image as ImageIcon } from 'lucide-react';
import { Language, MediaItem, EntityRecord } from '../../types';
import { AssetSelector } from './AssetSelector';
import { VisualEditor } from './VisualEditor';
import { LANGUAGES } from '../../hooks/useEditorForm';

/* ── Toolbar ─────────────────────────────────────────────────── */

interface EditorToolbarProps {
  id: string;
  activeLang: Language;
  isTranslating: boolean;
  onBack: () => void;
  onDelete: () => void;
  onTranslate: () => void;
  onTranslateAll: () => void;
  onSave: () => void;
  t: (key: string) => string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  id, activeLang, isTranslating, onBack, onDelete, onTranslate, onTranslateAll, onSave, t,
}) => (
  <div className="flex justify-between items-center mb-8">
    <button onClick={onBack} className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors">
      <ArrowLeft className="h-5 w-5 mr-2" />
      {t('back')}
    </button>
    <div className="flex gap-2">
      {id !== 'new' && (
        <button
          onClick={onDelete}
          className="btn btn-secondary flex items-center bg-white border border-red-200 text-red-600 hover:bg-red-50 mr-4"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t('delete')}
        </button>
      )}
      <button
        onClick={onTranslateAll}
        disabled={isTranslating}
        className="btn btn-secondary flex items-center bg-white border border-neutral-300 hover:bg-neutral-50"
      >
        {isTranslating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Languages className="h-4 w-4 mr-2 text-primary-600" />
        )}
        {t('translateAll')}
      </button>
      {activeLang !== 'de' && (
        <button
          onClick={onTranslate}
          disabled={isTranslating}
          className="btn btn-secondary flex items-center bg-white border border-neutral-300 hover:bg-neutral-50"
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Languages className="h-4 w-4 mr-2" />
          )}
          {t('translate')}
        </button>
      )}
      <button onClick={onSave} className="btn btn-primary">
        <Save className="h-4 w-4 mr-2" />
        {t('save')}
      </button>
    </div>
  </div>
);

/* ── Translation Progress ────────────────────────────────────── */

interface TranslationProgressProps {
  isTranslating: boolean;
  progress: { current: number; total: number };
  t: (key: string) => string;
}

export const TranslationProgress: React.FC<TranslationProgressProps> = ({ isTranslating, progress, t }) => {
  if (!isTranslating || progress.total <= 0) return null;
  const pct = Math.round((progress.current / progress.total) * 100);
  return (
    <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-neutral-700">{t('translate')}...</span>
        <span className="text-sm font-medium text-primary-600">{pct}%</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {progress.current} {t('searchFor')} {progress.total} {t('segmentsCompleted')}
      </p>
    </div>
  );
};

/* ── Validation Banners ──────────────────────────────────────── */

interface ValidationBannersProps {
  isValidating: boolean;
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;
  t: (key: string) => string;
}

export const ValidationBanners: React.FC<ValidationBannersProps> = ({ isValidating, validationErrors, setValidationErrors, t }) => (
  <>
    {isValidating && (
      <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center text-blue-700">
        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
        <span className="text-sm font-medium">{t('validatingAssets')}</span>
      </div>
    )}
    {validationErrors.length > 0 && (
      <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-red-800 flex items-center">
            <CloseIcon className="h-4 w-4 mr-2" />
            {t('validationErrors')}
          </h3>
          <button onClick={() => setValidationErrors([])} className="text-xs text-red-600 hover:text-red-800">
            {t('dismiss')}
          </button>
        </div>
        <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
          {validationErrors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </div>
    )}
  </>
);

/* ── Attribute Checkboxes ────────────────────────────────────── */

interface AttributeCheckboxesProps {
  attributes: { id: string; label: string }[];
  enabledAttributes: string[];
  onChange: (field: string, value: unknown) => void;
  t: (key: string) => string;
}

export const AttributeCheckboxes: React.FC<AttributeCheckboxesProps> = ({ attributes, enabledAttributes, onChange, t }) => (
  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
    <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3">{t('visibleAttributes')}</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {attributes.map(attr => (
        <label key={attr.id} className="flex items-center space-x-2 cursor-pointer group">
          <input
            type="checkbox"
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            checked={enabledAttributes.includes(attr.id)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange('enabledAttributes', [...enabledAttributes, attr.id]);
              } else {
                onChange('enabledAttributes', enabledAttributes.filter(id => id !== attr.id));
              }
            }}
          />
          <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{attr.label}</span>
        </label>
      ))}
    </div>
  </div>
);

/* ── Media Section ───────────────────────────────────────────── */

interface MediaSectionProps {
  formData: EntityRecord;
  contentMedia: {
    images: string[];
    audio: { url: string; title: string }[];
    videos: { url: string; title: string }[];
  };
  addLabel: string;
  onAdd: (type: 'images' | 'videos' | 'audio') => void;
  onRemove: (type: 'images' | 'videos' | 'audio', index: number) => void;
  onChange: (type: 'images' | 'videos' | 'audio', index: number, field: string, value: string) => void;
  t: (key: string) => string;
}

export const MediaSection: React.FC<MediaSectionProps> = ({ formData, contentMedia, addLabel, onAdd, onRemove, onChange, t }) => {
  if (!formData.enabledAttributes?.includes('media')) return null;

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
        <ImageIcon className="h-5 w-5 mr-2 text-primary-600" />
        {t('media')}
      </h3>

      <div className="space-y-6">
        {/* Images */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">{t('images')}</h4>
            <button onClick={() => onAdd('images')} className="text-xs flex items-center text-primary-600 hover:text-primary-700">
              <Plus className="h-3 w-3 mr-1" /> {addLabel}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {formData.media?.images?.map((url: string, idx: number) => {
              const isFromContent = contentMedia.images.includes(url);
              return (
                <div key={idx} className={`relative group ${isFromContent ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  <AssetSelector
                    label={`${t('image')} ${idx + 1}${isFromContent ? ` (${t('fromContent')})` : ''}`}
                    value={url}
                    onChange={(newUrl) => !isFromContent && onChange('images', idx, '', newUrl)}
                    assetType="image"
                    disabled={isFromContent}
                  />
                  {!isFromContent && (
                    <button
                      onClick={() => onRemove('images', idx)}
                      className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200 hover:bg-red-200"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                  {isFromContent && (
                    <div className="absolute top-0 right-0 p-1 bg-blue-100 text-blue-600 rounded-bl-lg text-[10px] font-bold">
                      {t('description')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Videos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">{t('videos')}</h4>
            <button onClick={() => onAdd('videos')} className="text-xs flex items-center text-primary-600 hover:text-primary-700">
              <Plus className="h-3 w-3 mr-1" /> {addLabel}
            </button>
          </div>
          <div className="space-y-6">
            {formData.media?.videos?.map((vid: MediaItem, idx: number) => {
              const isFromContent = contentMedia.videos.some(v => v.url === vid.url);
              return (
                <div key={idx} className={`p-4 rounded-lg border relative group transition-colors ${isFromContent ? 'bg-neutral-50 border-neutral-200 opacity-80' : 'bg-white border-neutral-200 hover:border-primary-200'}`}>
                  {!isFromContent && (
                    <button onClick={() => onRemove('videos', idx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full border border-red-100 shadow-sm">
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                  {isFromContent && (
                    <div className="absolute top-0 right-0 p-1 bg-blue-100 text-blue-600 rounded-bl-lg text-[10px] font-bold z-10">
                      {t('description')}
                    </div>
                  )}
                  <div className="space-y-4">
                    <AssetSelector
                      label={`${t('videos')} ${idx + 1}${isFromContent ? ` (${t('fromContent')})` : ''}`}
                      value={vid.url}
                      onChange={(url) => !isFromContent && onChange('videos', idx, 'url', url)}
                      assetType="video"
                      disabled={isFromContent}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" className="input text-sm px-3 py-2 border rounded bg-white" value={vid.title} onChange={(e) => onChange('videos', idx, 'title', e.target.value)} placeholder={t('title')} disabled={isFromContent} />
                      <input type="text" className="input text-sm px-3 py-2 border rounded bg-white col-span-full" value={vid.description} onChange={(e) => onChange('videos', idx, 'description', e.target.value)} placeholder={t('description')} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">{t('audio')} {t('files')}</h4>
            <button onClick={() => onAdd('audio')} className="text-xs flex items-center text-primary-600 hover:text-primary-700">
              <Plus className="h-3 w-3 mr-1" /> {addLabel}
            </button>
          </div>
          <div className="space-y-6">
            {formData.media?.audio?.map((aud: MediaItem, idx: number) => {
              const isFromContent = contentMedia.audio.some(a => a.url === aud.url);
              return (
                <div key={idx} className={`p-4 rounded-lg border relative group transition-colors ${isFromContent ? 'bg-neutral-50 border-neutral-200 opacity-80' : 'bg-white border-neutral-200 hover:border-primary-200'}`}>
                  {!isFromContent && (
                    <button onClick={() => onRemove('audio', idx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full border border-red-100 shadow-sm">
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                  {isFromContent && (
                    <div className="absolute top-0 right-0 p-1 bg-blue-100 text-blue-600 rounded-bl-lg text-[10px] font-bold z-10">
                      {t('description')}
                    </div>
                  )}
                  <div className="space-y-4">
                    <AssetSelector
                      label={`${t('audio')} ${idx + 1}${isFromContent ? ` (${t('fromContent')})` : ''}`}
                      value={aud.url}
                      onChange={(url) => !isFromContent && onChange('audio', idx, 'url', url)}
                      assetType="audio"
                      disabled={isFromContent}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" className="input text-sm px-3 py-2 border rounded bg-white" value={aud.title} onChange={(e) => onChange('audio', idx, 'title', e.target.value)} placeholder={t('title')} disabled={isFromContent} />
                      <input type="text" className="input text-sm px-3 py-2 border rounded bg-white col-span-full" value={aud.description} onChange={(e) => onChange('audio', idx, 'description', e.target.value)} placeholder={t('description')} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Language Tabs ────────────────────────────────────────────── */

interface LanguageTabsProps {
  activeLang: Language;
  onTabChange: (lang: Language) => void;
}

export const LanguageTabs: React.FC<LanguageTabsProps> = ({ activeLang, onTabChange }) => (
  <div className="flex border-b border-neutral-200 mb-4">
    {LANGUAGES.map(lang => (
      <button
        key={lang}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeLang === lang ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
        }`}
        onClick={() => onTabChange(lang)}
      >
        {lang.toUpperCase()}
      </button>
    ))}
  </div>
);

/* ── Translatable Text Field ─────────────────────────────────── */

interface TranslatableFieldProps {
  label: string;
  lang: string;
  value: string;
  onChange: (value: string) => void;
}

export const TranslatableTextField: React.FC<TranslatableFieldProps> = ({ label, lang, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">{label} ({lang})</label>
    <input
      type="text"
      className="input w-full px-3 py-2 border rounded-md"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

/* ── Translatable Markdown Field ─────────────────────────────── */

interface TranslatableMarkdownFieldProps {
  id: string;
  label: string;
  lang: string;
  value: string;
  onChange: (value: string) => void;
  editorKeySuffix: string;
}

export const TranslatableMarkdownField: React.FC<TranslatableMarkdownFieldProps> = ({ id, label, lang, value, onChange, editorKeySuffix }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">{label} ({lang})</label>
    <VisualEditor
      key={`${id}-${lang}-${editorKeySuffix}`}
      content={value}
      onChange={onChange}
    />
  </div>
);
