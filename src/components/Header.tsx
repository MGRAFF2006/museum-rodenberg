import React from 'react';
import { Search, Home, Menu, QrCode } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  onHomeClick: () => void;
  onMenuToggle: () => void;
  onQRScanToggle: () => void;
  searchQuery: string;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearchChange, 
  onHomeClick, 
  onMenuToggle, 
  onQRScanToggle,
  searchQuery,
  currentLanguage,
  onLanguageChange
}) => {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="container-max max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 transition-colors md:hidden focus-ring-sm"
              aria-label="Menü"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={onHomeClick}
              className="flex items-center gap-3 text-primary-700 hover:text-primary-600 transition-colors focus-ring-sm"
              aria-label="Zur Startseite"
            >
              <Home className="h-8 w-8" />
              <div className="hidden sm:block">
                <h1 className="text-heading font-serif font-bold text-neutral-900">Museum Rodenberg</h1>
                <p className="text-caption text-neutral-500">Digitale Ausstellungen</p>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5 pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', currentLanguage)}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input-base pl-10"
                aria-label="Suche"
              />
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onQRScanToggle}
              className="p-2 rounded-md text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 transition-colors focus-ring-sm"
              title="QR-Code Scanner"
              aria-label="QR-Code Scanner"
            >
              <QrCode className="h-6 w-6" />
            </button>
            
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            
            <button
              onClick={onHomeClick}
              className="px-4 py-2 text-body-sm font-semibold text-primary-700 hover:text-primary-600 transition-colors hidden md:block focus-ring-sm"
            >
              {t('allExhibitions', currentLanguage)}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="py-3 md:hidden border-t border-neutral-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', currentLanguage)}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-base pl-10 w-full"
              aria-label="Suche"
            />
          </div>
        </div>
      </div>
    </header>
  );
};