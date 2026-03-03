import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation } from 'convex/react';
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
  /** Loads existing entity data by ID; returns undefined if not found */
  loadEntity: (id: string) => EntityRecord | undefined;
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
    loadEntity,
    deleteConfirmKey,
  } = config;

  const { refreshData } = useContentData();
  const { t } = useLanguage();
  const { isTranslating, translationProgress, translateFields } = useContentTranslation();
  const { isValidating, validationErrors, validateAssets, setValidationErrors } = useAssetValidation();

  // Convex mutations
  const saveExhibition = useMutation(api.exhibitions.save);
  const removeExhibition = useMutation(api.exhibitions.remove);
  const saveArtifact = useMutation(api.artifacts.save);
  const removeArtifact = useMutation(api.artifacts.remove);

  const [activeLang, setActiveLang] = useState<Language>('de');

  const initialTranslations = LANGUAGES.reduce((acc, lang) => ({
    ...acc,
    [lang]: { ...initialTranslationFields }
  }), {} as Record<string, Record<string, string>>);

  const initialDetailedContent = LANGUAGES.reduce((acc, lang) => ({
    ...acc,
    [lang]: ''
  }), {} as Record<string, string>);

  const [formData, setFormData] = useState<EntityRecord>({
    translations: initialTranslations,
    detailedContent: initialDetailedContent,
    _hashes: {},
  });

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
    Object.values(formData.translations || {}).forEach((trans: Record<string, string>) => {
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

  // Load existing entity
  useEffect(() => {
    if (id !== 'new') {
      const entity = loadEntity(id);
      if (entity) {
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

        Object.values(entity.translations || {}).forEach((trans: Record<string, string>) => {
          contentMediaFields.forEach(field => extract(trans?.[field] || ''));
        });
        Object.values(entity.detailedContent || {}).forEach((c: string) => extract(c));

        setManualMedia({
          images: normalizedMedia.images.filter((img: string) => !currentContent.images.has(img)),
          videos: normalizedMedia.videos.filter((v: MediaItem) => !currentContent.videos.has(v.url)),
          audio: normalizedMedia.audio.filter((a: MediaItem) => !currentContent.audio.has(a.url)),
        });
      }
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMediaChange = useCallback((type: 'images' | 'videos' | 'audio', index: number, field: string, value: string) => {
    const currentMediaArray = formData.media?.[type];
    if (!currentMediaArray || !currentMediaArray[index]) return;

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
    if (!currentMediaArray || !currentMediaArray[index]) return;

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
    } catch (e) {
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
    } catch (e) {
      alert(t('someTranslationsFailed'));
    }
  }, [getFieldsToTranslate, getUnifiedTranslations, formData._hashes, handleTranslationUpdate, t, translateFields]);

  const handleSave = useCallback(async () => {
    const isValid = await validateAssets(formData);
    if (!isValid) {
      alert(t('validationErrors'));
      return;
    }

    try {
      const slug = (formData.id || '').toLowerCase();
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
        mediaItems.push({ mediaType: 'image', url: img, sortOrder: sortIdx++ });
      }
      for (const vid of formData.media?.videos || []) {
        mediaItems.push({
          mediaType: 'video',
          url: vid.url,
          title: vid.title || undefined,
          description: vid.description || undefined,
          sortOrder: sortIdx++,
        });
      }
      for (const aud of formData.media?.audio || []) {
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
              subtitle: t.subtitle || undefined,
              description: t.description || '',
              detailedContent: formData.detailedContent?.[lang] || undefined,
            };
          });

        await saveExhibition({
          slug,
          qrCode: (formData.qrCode as string) || slug,
          image: formData.image || '',
          dateRange: (formData.dateRange as string) || undefined,
          location: (formData.location as string) || undefined,
          curator: (formData.curator as string) || undefined,
          organizer: (formData.organizer as string) || undefined,
          sponsor: (formData.sponsor as string) || undefined,
          tags: (formData.tags as string[]) || undefined,
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
              period: t.period || undefined,
              artist: t.artist || undefined,
              description: t.description || '',
              significance: t.significance || undefined,
              detailedContent: formData.detailedContent?.[lang] || undefined,
            };
          });

        await saveArtifact({
          slug,
          qrCode: (formData.qrCode as string) || slug,
          exhibitionSlug: (formData.exhibition as string) || undefined,
          image: formData.image || '',
          materials: (formData.materials as string[]) || undefined,
          dimensions: (formData.dimensions as string) || undefined,
          provenance: (formData.provenance as string) || undefined,
          tags: (formData.tags as string[]) || undefined,
          enabledAttributes: formData.enabledAttributes || undefined,
          translations,
          mediaItems,
        });
      }

      // refreshData is a no-op with Convex (reactive), but call it for API compat
      refreshData();
      onBack(true);
    } catch (error) {
      console.error('Error saving:', error);
      alert(t('errorSaving'));
    }
  }, [formData, contentType, validateAssets, saveExhibition, saveArtifact, refreshData, onBack, t]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t(deleteConfirmKey))) return;

    try {
      const slug = (formData.id || id).toLowerCase();

      if (contentType === 'exhibition') {
        await removeExhibition({ slug });
      } else {
        await removeArtifact({ slug });
      }

      refreshData();
      onBack(true);
    } catch (error) {
      console.error('Error deleting:', error);
      alert(t('errorDeleting'));
    }
  }, [contentType, id, formData.id, deleteConfirmKey, removeExhibition, removeArtifact, refreshData, onBack, t]);

  return {
    // State
    formData,
    setFormData,
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
