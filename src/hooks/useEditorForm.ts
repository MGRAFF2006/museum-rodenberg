import { ContentConflictError, useProtectedMutation } from './useProtectedMutation';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { api } from '../../convex/_generated/api';
import { Language, MediaItem, EntityRecord } from '../types';
import { extractMediaFromMarkdown } from '../utils/markdownUtils';
import { useContentTranslation } from './useContentTranslation';
import { useAssetValidation } from './useAssetValidation';
import { useLanguage } from './useLanguage';
import { useContentData } from './useContentData';

export const LANGUAGES: Language[] = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'];

/** Fields that contain translatable markdown in descriptions */
export type TranslatableField = {
  key: string;
  text: string;
  type: 'translation' | 'detailed';
  isMarkdown: boolean;
};

export interface EditorConfig {
  /** 'exhibition' or 'artifact' */
  contentType: 'exhibition' | 'artifact';
  /** The entity ID (or 'new') */
  id: string;
  /** Callback to navigate back */
  onBack: (saved?: boolean) => void;
  /** Initial translations shape per language (keys vary by entity type) */
  initialTranslationFields: Record<string, string>;
  /** Default enabled attributes */
  defaultEnabledAttributes: string[];
  /** Which translation fields to extract content media from (e.g. ['description'] or ['description', 'significance']) */
  contentMediaFields: string[];
  /** Returns the fields to translate from German source */
  getFieldsToTranslate: (formData: EntityRecord) => TranslatableField[];
  /** Full raw entity: undefined while loading, null when not found. */
  entity: EntityRecord | null | undefined;
  /** Confirm message key for delete */
  deleteConfirmKey: string;
}

export function useEditorForm(config: EditorConfig) {
  const {
    contentType,
    id,
    onBack,
    initialTranslationFields,
    defaultEnabledAttributes,
    contentMediaFields,
    getFieldsToTranslate: getFieldsToTranslateFn,
    entity,
    deleteConfirmKey,
  } = config;

  const { refreshData } = useContentData();
  const { t } = useLanguage();
  const { isTranslating, translationProgress, translateFields } = useContentTranslation();
  const { isValidating, validationErrors, validateAssets, setValidationErrors } = useAssetValidation();

  // Convex mutations
  const saveExhibition = useProtectedMutation(api.exhibitions.save);
  const removeExhibition = useProtectedMutation(api.exhibitions.remove);
  const saveArtifact = useProtectedMutation(api.artifacts.save);
  const removeArtifact = useProtectedMutation(api.artifacts.remove);

  const [activeLang, setActiveLang] = useState<Language>('de');
  const loadedLanguages = useRef<string[]>([]);

  const emptyForm = useMemo<EntityRecord>(() => ({
    translations: Object.fromEntries(LANGUAGES.map(lang => [lang, { ...initialTranslationFields }])),
    detailedContent: Object.fromEntries(LANGUAGES.map(lang => [lang, ''])),
    enabledAttributes: defaultEnabledAttributes,
    media: { images: [], videos: [], audio: [] },
    _hashes: {},
  }), [initialTranslationFields, defaultEnabledAttributes]);

  const [formData, setFormData] = useState<EntityRecord>(emptyForm);
  const [draftId, setDraftId] = useState(id);
  const [initializedId, setInitializedId] = useState<string | null>(id === 'new' ? id : null);
  const isReady = initializedId === id && (id === 'new' || entity?.id === id);
  const isNotFound = id !== 'new' && entity === null;

  const [manualMedia, setManualMedia] = useState<{
    images: string[];
    videos: MediaItem[];
    audio: MediaItem[];
  }>({
    images: [],
    videos: [],
    audio: [],
  });

  // Extract media from all translations and detailed content
  const contentMedia = useMemo(() => {
    const images = new Set<string>();
    const audio = new Map<string, { url: string; title: string }>();
    const videos = new Map<string, { url: string; title: string }>();

    const extractFromText = (text: string) => {
      const media = extractMediaFromMarkdown(text || '');
      media.images.forEach(img => images.add(img));
      media.audio.forEach(a => audio.set(a.url, a));
      media.videos.forEach(v => videos.set(v.url, v));
    };

    // Extract from configured translation fields
    Object.values(formData.translations || {}).forEach((trans) => {
      contentMediaFields.forEach(field => {
        extractFromText(trans?.[field] || '');
      });
    });

    // Extract from all detailed content
    Object.values(formData.detailedContent || {}).forEach((content: string) => {
      extractFromText(content);
    });

    return {
      images: Array.from(images),
      audio: Array.from(audio.values()),
      videos: Array.from(videos.values()),
    };
  }, [formData.translations, formData.detailedContent, contentMediaFields]);

  // Sync content media + manual media to the form data
  useEffect(() => {
    const mergedMedia = {
      images: [...contentMedia.images],
      videos: [...contentMedia.videos.map(v => {
        const existing = formData.media?.videos?.find((ev: MediaItem) => ev.url === v.url);
        return { ...v, description: existing?.description || '' };
      })],
      audio: [...contentMedia.audio.map(a => {
        const existing = formData.media?.audio?.find((ea: MediaItem) => ea.url === a.url);
        return { ...a, description: existing?.description || '' };
      })],
    };

    manualMedia.images.forEach(img => {
      if (!mergedMedia.images.includes(img)) mergedMedia.images.push(img);
    });
    manualMedia.videos.forEach(v => {
      if (!mergedMedia.videos.some(mv => mv.url === v.url)) mergedMedia.videos.push(v);
    });
    manualMedia.audio.forEach(a => {
      if (!mergedMedia.audio.some(ma => ma.url === a.url)) mergedMedia.audio.push(a);
    });

    const currentMedia = formData.media || { images: [], videos: [], audio: [] };
    const isSame = JSON.stringify(currentMedia) === JSON.stringify(mergedMedia);
    if (!isSame) {
      setFormData(prev => ({ ...prev, media: mergedMedia }));
    }
  }, [contentMedia, manualMedia, formData.media]);

  // Hydrate only once per selected ID; subscription updates must preserve drafts.
  useEffect(() => {
    if (draftId !== id) {
      loadedLanguages.current = [];
      setDraftId(id);
      setInitializedId(null);
      setFormData(emptyForm);
      setManualMedia({ images: [], videos: [], audio: [] });
    } else if (initializedId === id) {
      return;

    }

    if (id === 'new') {
      setInitializedId(id);
    } else if (entity?.id === id) {
      loadedLanguages.current = Object.keys(entity.translations || {});
      const normalizedMedia = {
        images: entity.media?.images || [],
        videos: entity.media?.videos || [],
        audio: entity.media?.audio || [],
      };
      setFormData({
        ...entity,
        media: normalizedMedia,
        enabledAttributes: entity.enabledAttributes || defaultEnabledAttributes,
      });

      // Initialize manual media by filtering out what's already in content
      const currentContent = {
        images: new Set<string>(),
        videos: new Set<string>(),
        audio: new Set<string>(),
      };

      const extract = (text: string) => {
        const m = extractMediaFromMarkdown(text || '');
        m.images.forEach(i => currentContent.images.add(i));
        m.videos.forEach(v => currentContent.videos.add(v.url));
        m.audio.forEach(a => currentContent.audio.add(a.url));
      };

      Object.values(entity.translations || {}).forEach((trans) => {
        contentMediaFields.forEach(field => extract(trans?.[field] || ''));
      });
      Object.values(entity.detailedContent || {}).forEach((c: string) => extract(c));

      setManualMedia({
        images: normalizedMedia.images.filter((img: string) => !currentContent.images.has(img)),
        videos: normalizedMedia.videos.filter((v: MediaItem) => !currentContent.videos.has(v.url)),
        audio: normalizedMedia.audio.filter((a: MediaItem) => !currentContent.audio.has(a.url)),
      });
      setInitializedId(id);
    }
  }, [id, draftId, initializedId, entity, emptyForm, defaultEnabledAttributes, contentMediaFields]);

  const handleChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMediaChange = useCallback((type: 'images' | 'videos' | 'audio', index: number, field: string, value: string) => {
    const currentMediaArray = formData.media?.[type];
    if (!currentMediaArray || !Number.isInteger(index) || index < 0 || index >= currentMediaArray.length) return;

    const item = currentMediaArray[index];
    const url = type === 'images' ? (item as string) : (item as MediaItem).url;

    const isFromContent = type === 'images'
      ? contentMedia.images.includes(url)
      : contentMedia[type].some((contentItem: { url: string }) => contentItem.url === url);

    if (isFromContent && field !== 'description') return;

    if (!isFromContent) {
      const newManual = { ...manualMedia };
      if (type === 'images') {
        const manualIndex = newManual.images.indexOf(url);
        if (manualIndex !== -1) {
          newManual.images[manualIndex] = value;
          setManualMedia(newManual);
        }
      } else {
        const manualIndex = newManual[type].findIndex((manualItem: MediaItem) => manualItem.url === url);
        if (manualIndex !== -1) {
          newManual[type][manualIndex] = { ...newManual[type][manualIndex], [field]: value };
          setManualMedia(newManual);
        }
      }
    } else {
      const newMedia = {
        images: [...(formData.media?.images || [])],
        videos: [...(formData.media?.videos || [])],
        audio: [...(formData.media?.audio || [])],
      };
      if (type !== 'images') {
        newMedia[type][index] = { ...newMedia[type][index], [field]: value } as MediaItem;
        setFormData(prev => ({ ...prev, media: newMedia }));
      }
    }
  }, [formData.media, contentMedia, manualMedia]);

  const addMediaItem = useCallback((type: 'images' | 'videos' | 'audio') => {
    const newManual = { ...manualMedia };
    if (type === 'images') {
      newManual.images.push('');
    } else if (type === 'videos') {
      newManual.videos.push({ url: '', title: '', description: '' });
    } else {
      newManual.audio.push({ url: '', title: '', description: '' });
    }
    setManualMedia(newManual);
  }, [manualMedia]);

  const removeMediaItem = useCallback((type: 'images' | 'videos' | 'audio', index: number) => {
    const currentMediaArray = formData.media?.[type];
    if (!currentMediaArray || !Number.isInteger(index) || index < 0 || index >= currentMediaArray.length) return;

    const item = currentMediaArray[index];
    const urlToRemove = type === 'images' ? (item as string) : (item as MediaItem).url;
    const newManual = { ...manualMedia };

    if (type === 'images') {
      newManual.images = newManual.images.filter((url: string) => url !== urlToRemove);
    } else {
      newManual[type] = (newManual[type] as MediaItem[]).filter((manualItem: MediaItem) => manualItem.url !== urlToRemove);
    }
    setManualMedia(newManual);
  }, [formData.media, manualMedia]);

  const handleTranslationChange = useCallback((lang: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...(prev.translations?.[lang] || {}),
          [field]: value,
        },
      },
    }));
  }, []);

  const handleDetailedContentChange = useCallback((lang: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      detailedContent: {
        ...prev.detailedContent,
        [lang]: value,
      },
    }));
  }, []);

  const handleTranslationUpdate = useCallback((lang: Language, fieldKey: string, type: 'translation' | 'detailed', value: string, hash: string) => {
    setFormData(prev => {
      const newHashes = { ...(prev._hashes || {}) };
      if (type === 'translation') {
        newHashes[fieldKey] = hash;
        return {
          ...prev,
          _hashes: newHashes,
          translations: {
            ...prev.translations,
            [lang]: {
              ...(prev.translations?.[lang] || {}),
              [fieldKey]: value,
            },
          },
        };
      } else {
        newHashes.detailedContent = hash;
        return {
          ...prev,
          _hashes: newHashes,
          detailedContent: {
            ...prev.detailedContent,
            [lang]: value,
          },
        };
      }
    });
  }, []);

  const getFieldsToTranslate = useCallback(() => {
    return getFieldsToTranslateFn(formData);
  }, [formData, getFieldsToTranslateFn]);

  const getUnifiedTranslations = useCallback(() => {
    const unified: Record<string, Record<string, string | undefined>> = {};
    LANGUAGES.forEach(lang => {
      unified[lang] = {
        ...(formData.translations?.[lang] || {}),
        detailed: formData.detailedContent?.[lang],
      };
    });
    return unified;
  }, [formData.translations, formData.detailedContent]);

  const handleTranslate = useCallback(async () => {
    if (activeLang === 'de') return alert(t('cannotTranslateSame'));
    const fields = getFieldsToTranslate();
    if (fields.length === 0) return alert(t('noGermanContent'));

    try {
      await translateFields(
        fields,
        [activeLang],
        handleTranslationUpdate,
        formData._hashes || {},
        getUnifiedTranslations(),
      );
    } catch {
      alert(t('translationFailed'));
    }
  }, [activeLang, getFieldsToTranslate, getUnifiedTranslations, formData._hashes, handleTranslationUpdate, t, translateFields]);

  const handleTranslateAll = useCallback(async () => {
    const fields = getFieldsToTranslate();
    if (fields.length === 0) return alert(t('noGermanContent'));
    if (!confirm(t('confirmOverwrite'))) return;

    try {
      const targetLangs = LANGUAGES.filter(l => l !== 'de');
      await translateFields(
        fields,
        targetLangs,
        handleTranslationUpdate,
        formData._hashes || {},
        getUnifiedTranslations(),
      );
    } catch {
      alert(t('someTranslationsFailed'));
    }
  }, [getFieldsToTranslate, getUnifiedTranslations, formData._hashes, handleTranslationUpdate, t, translateFields]);

  const handleSave = useCallback(async () => {
    if (!isReady || isTranslating) return;

    const removeLanguages = loadedLanguages.current.filter(lang => !formData.translations?.[lang]?.title);
    const isValid = await validateAssets(formData);
    if (!isValid) {
      alert(t('validationErrors'));
      return;
    }

    try {
      const slug = id === 'new' ? (formData.id || '').toLowerCase() : id;
      const LANGS: Language[] = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'];

      // Build media items array from formData.media
      const mediaItems: Array<{
        mediaType: 'image' | 'video' | 'audio';
        url: string;
        title?: string;
        description?: string;
        sortOrder: number;
      }> = [];
      let sortIdx = 0;
      for (const img of formData.media?.images || []) {
        if (!img.trim()) continue;
        mediaItems.push({ mediaType: 'image', url: img, sortOrder: sortIdx++ });
      }
      for (const vid of formData.media?.videos || []) {
        if (!vid.url.trim()) continue;
        mediaItems.push({
          mediaType: 'video',
          url: vid.url,
          title: vid.title || undefined,
          description: vid.description || undefined,
          sortOrder: sortIdx++,
        });
      }
      for (const aud of formData.media?.audio || []) {
        if (!aud.url.trim()) continue;
        mediaItems.push({
          mediaType: 'audio',
          url: aud.url,
          title: aud.title || undefined,
          description: aud.description || undefined,
          sortOrder: sortIdx++,
        });
      }

      if (contentType === 'exhibition') {
        // Build exhibition translations array
        const translations = LANGS
          .filter(lang => formData.translations?.[lang]?.title)
          .map(lang => {
            const t = formData.translations![lang];
            return {
              language: lang,
              title: t.title || '',
              subtitle: Object.prototype.hasOwnProperty.call(t, 'subtitle') ? t.subtitle || '' : undefined,
              description: t.description || '',
              detailedContent: Object.prototype.hasOwnProperty.call(formData.detailedContent || {}, lang) ? formData.detailedContent?.[lang] || '' : undefined,
            };
          });

        await saveExhibition({
          createOnly: id === 'new',
          removeLanguages,
          slug,
          expectedRevision: id === 'new' ? undefined : formData.revision ?? 0,
          expectedDocumentId: id === 'new' ? undefined : formData.documentId,
          qrCode: (formData.qrCode as string) || slug,
          image: formData.image || '',
          dateRange: (formData.dateRange as string) || '',
          location: (formData.location as string) || '',
          curator: (formData.curator as string) || '',
          organizer: (formData.organizer as string) || '',
          sponsor: (formData.sponsor as string) || '',
          tags: formData.tags?.map(tag => tag.trim()).filter(Boolean),
          enabledAttributes: formData.enabledAttributes || undefined,
          isFeatured: (formData.isFeatured as boolean) || false,
          artifactSlugs: (formData.artifacts as string[]) || [],
          translations,
          mediaItems,
        });
      } else {
        // Build artifact translations array
        const translations = LANGS
          .filter(lang => formData.translations?.[lang]?.title)
          .map(lang => {
            const t = formData.translations![lang];
            return {
              language: lang,
              title: t.title || '',
              period: Object.prototype.hasOwnProperty.call(t, 'period') ? t.period || '' : undefined,
              artist: Object.prototype.hasOwnProperty.call(t, 'artist') ? t.artist || '' : undefined,
              description: t.description || '',
              significance: Object.prototype.hasOwnProperty.call(t, 'significance') ? t.significance || '' : undefined,
              detailedContent: Object.prototype.hasOwnProperty.call(formData.detailedContent || {}, lang) ? formData.detailedContent?.[lang] || '' : undefined,
            };
          });

        await saveArtifact({
          createOnly: id === 'new',
          removeLanguages,
          slug,
          expectedRevision: id === 'new' ? undefined : formData.revision ?? 0,
          expectedDocumentId: id === 'new' ? undefined : formData.documentId,
          qrCode: (formData.qrCode as string) || slug,
          exhibitionSlug: (formData.exhibition as string) || '',
          image: formData.image || '',
          materials: formData.materials?.map(material => material.trim()).filter(Boolean),
          dimensions: (formData.dimensions as string) || '',
          provenance: (formData.provenance as string) || '',
          tags: formData.tags?.map(tag => tag.trim()).filter(Boolean),
          enabledAttributes: formData.enabledAttributes || undefined,
          translations,
          mediaItems,
        });
      }

      // refreshData is a no-op with Convex (reactive), but call it for API compat
      refreshData();
      onBack(true);
    } catch (error) {
      if (error instanceof ContentConflictError) {
        setValidationErrors([t('contentChangedReload')]);
        alert(t('contentChangedReload'));
        return;
      }
      console.error('Error saving:', error);
      alert(t('errorSaving'));
    }
  }, [isReady, isTranslating, id, formData, contentType, validateAssets, saveExhibition, saveArtifact, refreshData, onBack, t, setValidationErrors]);

  const handleDelete = useCallback(async () => {
    if (id === 'new') return;
    if (!window.confirm(t(deleteConfirmKey))) return;

    try {
      const args = {
        slug: id,
        expectedRevision: formData.revision ?? 0,
        expectedDocumentId: formData.documentId,
      };

      if (contentType === 'exhibition') {
        await removeExhibition(args);
      } else {
        await removeArtifact(args);
      }

      refreshData();
      onBack(true);
    } catch (error) {
      if (error instanceof ContentConflictError) {
        setValidationErrors([t('contentChangedReload')]);
        alert(t('contentChangedReload'));
        return;
      }
      console.error('Error deleting:', error);
      alert(t('errorDeleting'));
    }
  }, [contentType, id, formData.revision, formData.documentId, deleteConfirmKey, removeExhibition, removeArtifact, refreshData, onBack, t, setValidationErrors]);

  return {
    // State
    formData,
    setFormData,
    isReady,
    isNotFound,
    activeLang,
    setActiveLang,
    contentMedia,
    manualMedia,

    // Translation state
    isTranslating,
    translationProgress,

    // Validation state
    isValidating,
    validationErrors,
    setValidationErrors,

    // Handlers
    handleChange,
    handleMediaChange,
    addMediaItem,
    removeMediaItem,
    handleTranslationChange,
    handleDetailedContentChange,
    handleTranslate,
    handleTranslateAll,
    handleSave,
    handleDelete,

    // Utilities
    t,
    languages: LANGUAGES,
  };
}
