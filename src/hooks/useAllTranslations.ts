import { useEffect, useState } from 'react';
import { Language } from './useLanguage';
import { translations } from '../utils/translations';

interface TranslationBundle {
  cached: { [key: string]: string };
  ui: { [key: string]: string };
}

/**
 * Hook to get both cached and UI translations for the current language
 * Falls back to German if translation not found
 */
export const useAllTranslations = (language: Language) => {
  const [bundle, setBundle] = useState<TranslationBundle>({
    cached: {},
    ui: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        
        // Load cached translations from public/translations
        let cachedTrans = {};
        try {
          const response = await fetch(`/translations/${language}.json`);
          if (response.ok) {
            cachedTrans = await response.json();
          }
        } catch (err) {
          console.warn(`Could not load cached translations for ${language}:`, err);
        }
        
        // Load UI translations from the bundled translations
        const uiTrans = (translations[language] || translations.de) as { [key: string]: string };
        
        setBundle({
          cached: cachedTrans,
          ui: uiTrans,
        });
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  /**
   * Get a translation string
   * First checks cached translations (for content), then UI translations
   * Falls back to German if not found
   */
  const t = (key: string): string => {
    // Try cached first
    if (bundle.cached[key]) {
      return bundle.cached[key];
    }
    
    // Try UI translations
    if (bundle.ui[key]) {
      return bundle.ui[key];
    }
    
    // Fallback to German
    const deTrans = (translations.de || {}) as { [key: string]: string };
    return deTrans[key] || key;
  };

  return { t, loading, bundle };
};
