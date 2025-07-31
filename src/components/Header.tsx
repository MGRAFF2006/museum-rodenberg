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
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-gray-600 hover:text-blue-800 hover:bg-gray-100 transition-colors md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={onHomeClick}
              className="flex items-center space-x-3 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <Home className="h-8 w-8" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold">Museum Rodenberg</h1>
                <p className="text-xs text-gray-600">Digitale Ausstellungen</p>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', currentLanguage)}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500"
              />
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onQRScanToggle}
              className="p-2 rounded-md text-gray-600 hover:text-blue-800 hover:bg-gray-100 transition-colors"
              title="QR-Code Scanner"
            >
              <QrCode className="h-6 w-6" />
            </button>
            
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            
            <button
              onClick={onHomeClick}
              className="px-4 py-2 text-sm font-medium text-blue-800 hover:text-blue-600 transition-colors hidden md:block"
            >
              {t('allExhibitions', currentLanguage)}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};