import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pl';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('museum-language') as Language;
    if (savedLanguage && ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('museum-language', language);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
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
