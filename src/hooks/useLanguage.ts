import { useState, useEffect } from 'react';

export type Language = 'de' | 'en' | 'fr';

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('museum-language') as Language;
    if (savedLanguage && ['de', 'en', 'fr'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('museum-language', language);
  };

  return { currentLanguage, changeLanguage };
};