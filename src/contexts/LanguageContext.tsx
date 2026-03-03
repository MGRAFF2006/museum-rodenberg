import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadFallback = useCallback(async () => {
    try {
      const response = await fetch('/translations/de.json?v=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        setFallbackTranslations(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    } catch (error) {
      console.error('Failed to load fallback translations:', error);
    }
  }, []);

  const loadTranslations = useCallback(async (isSilent = false) => {
    if (currentLanguage === 'de') {
      setTranslations(fallbackTranslations);
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    try {
      const response = await fetch(`/translations/${currentLanguage}.json?v=` + Date.now());
      if (response.ok) {
        const data = await response.json();
        setTranslations(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [currentLanguage, fallbackTranslations]);

  // Load German as fallback immediately
  useEffect(() => {
    loadFallback();

    const savedLanguage = localStorage.getItem('museum-language') as Language;
    if (savedLanguage && ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, [loadFallback]);

  useEffect(() => {
    if (Object.keys(fallbackTranslations).length > 0 || currentLanguage !== 'de') {
      loadTranslations();
    }
  }, [loadTranslations, fallbackTranslations]);

  // Polling mechanism for translations in development
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      const interval = setInterval(() => {
        loadFallback();
        if (currentLanguage !== 'de') {
          loadTranslations(true); // Pass true for silent loading
        }
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentLanguage, loadFallback, loadTranslations]);

  const changeLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('museum-language', language);
  };

  const t = useCallback((key: string): string => {
    return translations[key] || fallbackTranslations[key] || key;
  }, [translations, fallbackTranslations]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
