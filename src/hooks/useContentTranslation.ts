import { useState, useCallback } from 'react';
import { Language } from '../types';
import { translateField, splitMarkdown, getHash } from '../utils/translationUtils';

interface TranslationField {
  key: string;
  text: string;
  type: 'translation' | 'detailed';
  isMarkdown: boolean;
}

export const useContentTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });

  const translateFields = useCallback(async (
    fields: TranslationField[],
    targetLangs: Language[],
    onUpdate: (lang: Language, fieldKey: string, type: 'translation' | 'detailed', value: string, hash: string) => void,
    existingHashes: Record<string, string> = {},
    currentTranslations: Record<string, any> = {}
  ) => {
    if (fields.length === 0 || targetLangs.length === 0) return;

    setIsTranslating(true);
    try {
      // Calculate total steps for progress bar
      let totalSteps = 0;
      for (const field of fields) {
        const hash = await getHash(field.text);
        
        for (const lang of targetLangs) {
          // Check if we already have this translation and the hash matches
          const existingValue = currentTranslations[lang]?.[field.key];
          
          const hashKey = field.key.endsWith('detailed') 
            ? field.key.replace('detailed', 'detailedContent') 
            : field.key;
          const isUpToDate = (existingValue && existingValue.trim() !== "") && existingHashes[hashKey] === hash;

          if (!isUpToDate) {
            if (field.isMarkdown) {
              const blocks = splitMarkdown(field.text);
              totalSteps += blocks.filter(b => b.type === 'text' && b.content.trim()).length;
            } else {
              totalSteps += 1;
            }
          }
        }
      }
      
      setTranslationProgress({ current: 0, total: totalSteps });

      const incrementProgress = () => {
        setTranslationProgress(prev => ({ ...prev, current: Math.min(prev.current + 1, totalSteps) }));
      };

      for (const lang of targetLangs) {
        for (const field of fields) {
          const hash = await getHash(field.text);
          const hashKey = field.key.endsWith('detailed') 
            ? field.key.replace('detailed', 'detailedContent') 
            : field.key;
          
          const existingValue = currentTranslations[lang]?.[field.key];
          
          const isUpToDate = (existingValue && existingValue.trim() !== "") && existingHashes[hashKey] === hash;

          if (isUpToDate) {
            // Even if up to date, notify with the existing value to ensure the caller has the full set of current data
            onUpdate(lang, field.key, field.type, existingValue, hash);
            continue;
          }

          const result = await translateField(field.text, lang, field.isMarkdown, incrementProgress);
          onUpdate(lang, field.key, field.type, result, hash);
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      setIsTranslating(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  }, []);

  return {
    isTranslating,
    translationProgress,
    translateFields
  };
};
