import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language } from '../types';
import { readPreference, writePreference } from '../utils/preferences';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
  loading: boolean;
}
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
function translationUrl(lang: string): string {
  const base = `/translations/${lang}.json`;
  return import.meta.env.DEV ? base + '?v=' + Date.now() : base;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de');
  const [dictionary, setDictionary] = useState<{ language: Language | null; values: Record<string, string> }>({ language: null, values: {} });
  const [fallbackTranslations, setFallbackTranslations] = useState<Record<string, string>>({});
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const [selectedLoading, setSelectedLoading] = useState(false);

  useEffect(() => {
    const savedLanguage = readPreference('museum-language') as Language;
    if (savedLanguage && ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'].includes(savedLanguage)) setCurrentLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    let active = true;
    let request = 0;
    let controller: AbortController | undefined;
    const load = async () => {
      const currentRequest = ++request;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(translationUrl('de'), { signal: controller.signal });
        if (!response.ok) throw new Error('German dictionary unavailable');
        const data = await response.json();
        if (active && request === currentRequest) setFallbackTranslations(data);
      } catch (error) {
        if (active && request === currentRequest) console.error('Failed to load fallback translations:', error);
      } finally {
        if (active && request === currentRequest) setFallbackLoading(false);
      }
    };
    void load();
    const interval = import.meta.env.DEV ? setInterval(load, 5000) : undefined;
    return () => { active = false; controller?.abort(); if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    if (currentLanguage === 'de') { setSelectedLoading(false); return; }
    let active = true;
    let request = 0;
    let controller: AbortController | undefined;
    setSelectedLoading(true);
    const load = async () => {
      const currentRequest = ++request;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(translationUrl(currentLanguage), { signal: controller.signal });
        if (!response.ok) throw new Error('Selected dictionary unavailable');
        const data = await response.json();
        if (active && request === currentRequest) setDictionary({ language: currentLanguage, values: data });
      } catch (error) {
        if (active && request === currentRequest) {
          setDictionary({ language: currentLanguage, values: {} });
          console.error('Failed to load translations:', error);
        }
      } finally {
        if (active && request === currentRequest) setSelectedLoading(false);
      }
    };
    void load();
    const interval = import.meta.env.DEV ? setInterval(load, 5000) : undefined;
    return () => { active = false; controller?.abort(); if (interval) clearInterval(interval); };
  }, [currentLanguage]);

  const changeLanguage = (language: Language) => {
    setCurrentLanguage(language);
    writePreference('museum-language', language);
  };
  const t = useCallback((key: string): string => {
    return (dictionary.language === currentLanguage ? dictionary.values[key] : undefined) || fallbackTranslations[key] || key;
  }, [dictionary, currentLanguage, fallbackTranslations]);
  return <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, loading: currentLanguage === 'de' ? fallbackLoading : selectedLoading }}>
    {children}
  </LanguageContext.Provider>;
};
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
