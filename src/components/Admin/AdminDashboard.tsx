import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, LogOut, Image as ImageIcon, FileText, Languages, Loader2 } from 'lucide-react';
import { useContentData } from '../../hooks/useContentData';
import { useLanguage } from '../../hooks/useLanguage';
import { useContentTranslation } from '../../hooks/useContentTranslation';
import { Language, EntityRecord } from '../../types';
import { TranslatableField } from '../../hooks/useEditorForm';
import { MediaLibrary } from './MediaLibrary';
import { authFetch } from '../../utils/auth';

interface AdminDashboardProps {
  onLogout: () => void;
  onEditExhibition: (id: string) => void;
  onEditArtifact: (id: string) => void;
  onAddExhibition: () => void;
  onAddArtifact: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onEditExhibition,
  onEditArtifact,
  onAddExhibition,
  onAddArtifact,
}) => {
  const { exhibitions, artifacts, refreshData } = useContentData();
  const { t } = useLanguage();
  const { isTranslating, translationProgress, translateFields } = useContentTranslation();
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | null>(null);

  const filteredArtifacts = useMemo(() => {
    if (!selectedExhibitionId) return artifacts;
    return artifacts.filter(art => art.exhibition === selectedExhibitionId);
  }, [artifacts, selectedExhibitionId]);

  const handleTranslateAll = useCallback(async () => {
    if (!confirm('This will regenerate translations for ALL items using German as the source. This may take several minutes and overwrite existing translations. Continue?')) return;

    try {
      // Fetch RAW data to ensure we have the source German content and all fields
      const [exRes, artRes] = await Promise.all([
        fetch('/src/content/exhibitions.json?v=' + Date.now()),
        fetch('/src/content/artifacts.json?v=' + Date.now())
      ]);
      const exData = await exRes.json();
      const artData = await artRes.json();
      
      const rawExhibitions = Object.values(exData.exhibitions || {}) as EntityRecord[];
      const rawArtifacts = Object.values(artData.artifacts || {}) as EntityRecord[];

      const allFields: TranslatableField[] = [];
      const languages: Language[] = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'];
      const targetLangs = languages.filter(l => l !== 'de');

      // Collect Exhibition fields
      rawExhibitions.forEach(ex => {
        const de = ex.translations?.de || {};
        const fields = [
          { key: `exhibition:${ex.id}:title`, text: de.title || '', type: 'translation' as const, isMarkdown: false },
          { key: `exhibition:${ex.id}:subtitle`, text: de.subtitle || '', type: 'translation' as const, isMarkdown: false },
          { key: `exhibition:${ex.id}:description`, text: de.description || '', type: 'translation' as const, isMarkdown: true },
          { key: `exhibition:${ex.id}:location`, text: de.location || '', type: 'translation' as const, isMarkdown: false },
          { key: `exhibition:${ex.id}:curator`, text: de.curator || '', type: 'translation' as const, isMarkdown: false },
          { key: `exhibition:${ex.id}:dateRange`, text: de.dateRange || '', type: 'translation' as const, isMarkdown: false },
          { key: `exhibition:${ex.id}:detailed`, text: (ex.detailedContent && ex.detailedContent.de) || '', type: 'detailed' as const, isMarkdown: true }
        ].filter(f => f.text);
        allFields.push(...fields);
      });

      // Collect Artifact fields
      rawArtifacts.forEach(art => {
        const de = art.translations?.de || {};
        const fields = [
          { key: `artifact:${art.id}:title`, text: de.title || '', type: 'translation' as const, isMarkdown: false },
          { key: `artifact:${art.id}:description`, text: de.description || '', type: 'translation' as const, isMarkdown: true },
          { key: `artifact:${art.id}:significance`, text: de.significance || '', type: 'translation' as const, isMarkdown: true },
          { key: `artifact:${art.id}:period`, text: de.period || '', type: 'translation' as const, isMarkdown: false },
          { key: `artifact:${art.id}:provenance`, text: de.provenance || '', type: 'translation' as const, isMarkdown: false },
          { key: `artifact:${art.id}:dimensions`, text: de.dimensions || '', type: 'translation' as const, isMarkdown: false },
          { key: `artifact:${art.id}:detailed`, text: (art.detailedContent && art.detailedContent.de) || '', type: 'detailed' as const, isMarkdown: true }
        ].filter(f => f.text);
        allFields.push(...fields);
      });

      if (allFields.length === 0) return alert('No German content to translate');

      const results: Record<string, {
        type: string;
        id: string;
        translations: Record<string, Record<string, string>>;
        detailedContent: Record<string, string>;
        _hashes: Record<string, string>;
      }> = {};

      // Prepare a map of existing hashes and translations for the hook to use for skipping
      const allExistingHashes: Record<string, string> = {};
      const allCurrentTranslations: Record<string, Record<string, string>> = {};
      
      [...rawExhibitions, ...rawArtifacts].forEach(item => {
        const itemType = item.curator !== undefined ? 'exhibition' : 'artifact';
        const prefix = `${itemType}:${item.id}`;
        
        if (item._hashes) {
          Object.entries(item._hashes).forEach(([k, v]) => {
            allExistingHashes[`${prefix}:${k}`] = v as string;
          });
        }
        
        targetLangs.forEach(lang => {
          if (!allCurrentTranslations[lang]) allCurrentTranslations[lang] = {};
          
          if (item.translations?.[lang]) {
            Object.entries(item.translations[lang]).forEach(([k, v]) => {
              allCurrentTranslations[lang][`${prefix}:${k}`] = v as string;
            });
          }
          
          if (item.detailedContent?.[lang]) {
            allCurrentTranslations[lang][`${prefix}:detailed`] = item.detailedContent[lang];
          }
        });
      });

      await translateFields(
        allFields, 
        targetLangs, 
        (lang, fullKey, type, value, hash) => {
          const [itemType, itemId, key] = fullKey.split(':');
          const storageKey = `${itemType}:${itemId}`;
          if (!results[storageKey]) {
            const original = itemType === 'exhibition' 
              ? rawExhibitions.find(e => e.id === itemId) 
              : rawArtifacts.find(a => a.id === itemId);
            
            results[storageKey] = { 
              type: itemType, 
              id: itemId, 
              translations: {}, 
              detailedContent: {},
              _hashes: { ...(original?._hashes || {}) }
            };
          }
          
          const item = results[storageKey];
          if (type === 'translation') {
            if (!item.translations[lang]) item.translations[lang] = {};
            item.translations[lang][key] = value;
            item._hashes[key] = hash;
          } else {
            item.detailedContent[lang] = value;
            item._hashes.detailedContent = hash;
          }
        },
        allExistingHashes,
        allCurrentTranslations
      );

      // Save all updated items back to the server sequentially
      for (const item of Object.values(results)) {
        const original = item.type === 'exhibition' 
          ? rawExhibitions.find(e => e.id === item.id) 
          : rawArtifacts.find(a => a.id === item.id);
        
        if (!original) continue;

        const dataToSave = {
          ...original,
          translations: {
            ...original.translations,
            ...item.translations
          },
          detailedContent: {
            ...original.detailedContent,
            ...item.detailedContent
          },
          _hashes: {
            ...(original._hashes || {}),
            ...item._hashes
          }
        };

        await authFetch('/api/save-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: item.type, data: dataToSave })
        });
      }

      alert('Bulk translation completed and all items updated!');
      refreshData();
    } catch (error) {
      console.error('Bulk translation failed:', error);
      alert('Bulk translation failed. Some items might not have been updated.');
    }
  }, [translateFields, refreshData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">
            {t('adminTitle')}
          </h1>
          <button
            onClick={handleTranslateAll}
            disabled={isTranslating}
            className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Languages className="h-4 w-4 mr-2" />
            )}
            {t('translateAll')}
          </button>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center text-neutral-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-2" />
          {t('logout')}
        </button>
      </div>

      {isTranslating && (
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-neutral-700">
              {t('bulkTranslationProgress')}
            </span>
            <span className="text-sm font-medium text-primary-600">
              {Math.round((translationProgress.current / translationProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {translationProgress.current} {t('searchFor')} {translationProgress.total} {t('segmentsCompleted')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exhibitions Management (Sidebar) */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              {t('exhibitions')}
            </h2>
            <button
              onClick={onAddExhibition}
              className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title={t('addExhibition')}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedExhibitionId(null)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors border ${
                selectedExhibitionId === null 
                  ? 'bg-primary-50 border-primary-200 text-primary-900' 
                  : 'bg-white border-transparent hover:bg-neutral-50 text-neutral-600'
              }`}
            >
              <div className="h-10 w-10 rounded bg-neutral-200 flex items-center justify-center mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <span className="font-medium text-left">{t('allArtifacts')}</span>
            </button>
            {exhibitions.map((ex) => (
              <div
                key={ex.id}
                className={`group flex items-center justify-between p-3 rounded-lg transition-colors border ${
                  selectedExhibitionId === ex.id 
                    ? 'bg-primary-50 border-primary-200 text-primary-900' 
                    : 'bg-white border-transparent hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <button 
                  onClick={() => setSelectedExhibitionId(ex.id)}
                  className="flex-1 flex items-center text-left overflow-hidden"
                >
                  <img
                    src={ex.image}
                    alt=""
                    className="h-10 w-10 rounded object-cover mr-3 bg-neutral-200"
                  />
                  <span className="font-medium truncate">{ex.title}</span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditExhibition(ex.id); }}
                    className="p-1 hover:text-primary-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Artifacts Management (Main) */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-accent-600" />
              {selectedExhibitionId 
                ? exhibitions.find(e => e.id === selectedExhibitionId)?.title 
                : t('artifacts')}
            </h2>
            <button
              onClick={onAddArtifact}
              className="btn btn-accent btn-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('addArtifact')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredArtifacts.map((art) => (
              <div
                key={art.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <div className="flex items-center overflow-hidden">
                  <img
                    src={art.image}
                    alt=""
                    className="h-12 w-12 rounded object-cover mr-3 bg-neutral-200"
                  />
                  <div className="overflow-hidden">
                    <p className="font-medium text-neutral-900 truncate">
                      {art.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      ID: {art.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditArtifact(art.id)}
                    className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
                    title={t('edit')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredArtifacts.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-500">
                No artifacts found for this selection.
              </div>
            )}
          </div>
        </section>
      </div>

      <MediaLibrary />
    </div>
  );
};
