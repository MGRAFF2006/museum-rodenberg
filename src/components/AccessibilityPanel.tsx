import React, { useState } from 'react';
import { Settings, X, Type, Eye, RotateCcw } from 'lucide-react';
import { useAccessibility, FontSize, FontFamily, ContrastMode } from '../hooks/useAccessibility';
import { Language } from '../hooks/useLanguage';
import { t } from '../utils/translations';

interface AccessibilityPanelProps {
  currentLanguage: Language;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  currentLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useAccessibility();

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Klein' },
    { value: 'medium', label: 'Normal' },
    { value: 'large', label: 'Groß' },
  ];

  const fontFamilyOptions: { value: FontFamily; label: string }[] = [
    { value: 'default', label: 'Standard' },
    { value: 'dyslexie', label: 'Dyslexie (Legasthenie-freundlich)' },
  ];

  const contrastOptions: { value: ContrastMode; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Hoher Kontrast' },
  ];


  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-blue-800 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Barrierefreiheit"
        aria-label="Barrierefreiheit-Einstellungen öffnen"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Barrierefreiheit</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <div className="flex items-center mb-3">
                    <Type className="h-5 w-5 text-blue-800 mr-2" />
                    <label className="text-sm font-semibold text-gray-900">
                      Schriftgröße
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fontSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ fontSize: option.value })}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          settings.fontSize === option.value
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <div className="flex items-center mb-3">
                    <Type className="h-5 w-5 text-blue-800 mr-2" />
                    <label className="text-sm font-semibold text-gray-900">
                      Schriftart
                    </label>
                  </div>
                  <div className="space-y-2">
                    {fontFamilyOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ fontFamily: option.value })}
                        className={`w-full p-3 text-sm rounded-lg border transition-colors text-left ${
                          settings.fontFamily === option.value
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className={option.value === 'dyslexie' ? 'font-dyslexie' : ''}>
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Mode */}
                <div>
                  <div className="flex items-center mb-3">
                    <Eye className="h-5 w-5 text-blue-800 mr-2" />
                    <label className="text-sm font-semibold text-gray-900">
                      Kontrast
                    </label>
                  </div>
                  <div className="space-y-2">
                    {contrastOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ contrastMode: option.value })}
                        className={`w-full p-3 text-sm rounded-lg border transition-colors text-left ${
                          settings.contrastMode === option.value
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={resetSettings}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Zurücksetzen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};