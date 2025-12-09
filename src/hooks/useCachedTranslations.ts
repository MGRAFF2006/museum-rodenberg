import { useEffect, useState } from 'react';
import { Language } from './useLanguage';

interface CachedTranslations {
  [key: string]: string;
}

export const useCachedTranslations = (language: Language) => {
  const [translations, setTranslations] = useState<CachedTranslations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the language-specific translation file from public/translations
        const response = await fetch(`/translations/${language}.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${language}`);
        }
        
        const data = await response.json();
        setTranslations(data);
      } catch (err) {
        console.error('Error loading cached translations:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty object on error
        setTranslations({});
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  return { translations, loading, error };
};
