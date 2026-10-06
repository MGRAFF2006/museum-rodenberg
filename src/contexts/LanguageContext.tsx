import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const isDev = import.meta.env.DEV;
const languages = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'];

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem('museum-language');
    if (saved && languages.includes(saved)) return saved as Language;
  } catch {
    // Preferences are optional when the browser denies storage.
  }
  return 'de';
}

/** In dev mode, bust cache to pick up file changes. */
async function loadMessages(language: Language, signal: AbortSignal): Promise<Record<string, string>> {
  const url = `/translations/${language}.json${isDev ? '?v=' + Date.now() : ''}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  return response.json();
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(savedLanguage);
  const [translations, setTranslations] = useState<{ language: Language; messages: Record<string, string> }>();
  const [fallbackTranslations, setFallbackTranslations] = useState<Record<string, string>>({});
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const [translationLoading, setTranslationLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let request = 0;
    const load = async () => {
      const currentRequest = ++request;
      try {
        const messages = await loadMessages('de', controller.signal);
        if (!controller.signal.aborted && currentRequest === request) setFallbackTranslations(messages);
      } catch (error) {
        if (!controller.signal.aborted) console.error('Failed to load fallback translations:', error);
      } finally {
        if (!controller.signal.aborted && currentRequest === request) setFallbackLoading(false);
      }
    };
    void load();
    const interval = isDev ? setInterval(() => void load(), 5000) : undefined;
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (currentLanguage === 'de') return;
    const controller = new AbortController();
    let request = 0;
    const load = async (silent = false) => {
      const currentRequest = ++request;
      if (!silent) setTranslationLoading(true);
      try {
        const messages = await loadMessages(currentLanguage, controller.signal);
        if (!controller.signal.aborted && currentRequest === request) {
          setTranslations({ language: currentLanguage, messages });
        }
      } catch (error) {
        if (!controller.signal.aborted && currentRequest === request) {
          setTranslations({ language: currentLanguage, messages: {} });
          console.error('Failed to load translations:', error);
        }
      } finally {
        if (!controller.signal.aborted && currentRequest === request) setTranslationLoading(false);
      }
    };
    void load();
    const interval = isDev ? setInterval(() => void load(true), 5000) : undefined;
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [currentLanguage]);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    try {
      localStorage.setItem('museum-language', currentLanguage);
    } catch {
      // Keep language switching available without persistent storage.
    }
  }, [currentLanguage]);

  const changeLanguage = (language: Language) => setCurrentLanguage(language);
  const t = useCallback((key: string): string => {
    const messages = translations?.language === currentLanguage ? translations.messages : undefined;
    return messages?.[key] || fallbackTranslations[key] || key;
  }, [translations, currentLanguage, fallbackTranslations]);
  const loading = currentLanguage === 'de' ? fallbackLoading : translationLoading;

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
