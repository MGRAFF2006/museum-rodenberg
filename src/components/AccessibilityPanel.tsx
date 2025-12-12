import React, { useState } from 'react';
import { Settings, X, Type, Eye, RotateCcw, Volume2 } from 'lucide-react';
import { useAccessibility, FontSize, FontFamily, ContrastMode } from '../hooks/useAccessibility';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
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
  const { getVoicesForLanguage, settings: ttsSettings, updateSettings: updateTTSSettings } = useTextToSpeech();

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

  const voicesForLanguage = getVoicesForLanguage(currentLanguage);

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary fixed bottom-4 right-4 z-40 rounded-full p-3 h-12 w-12"
        title="Barrierefreiheit"
        aria-label="Barrierefreiheit-Einstellungen öffnen"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading-lg font-semibold text-neutral-900">Barrierefreiheit</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-ring-sm"
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <div className="flex items-center mb-3">
                    <Type className="metadata-icon" />
                    <label className="text-body-sm font-semibold text-neutral-900">
                      Schriftgröße
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fontSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ fontSize: option.value })}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          settings.fontSize === option.value
                            ? 'badge-primary'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
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
                    <Type className="metadata-icon" />
                    <label className="text-body-sm font-semibold text-neutral-900">
                      Schriftart
                    </label>
                  </div>
                  <div className="space-y-2">
                    {fontFamilyOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ fontFamily: option.value })}
                        className={`w-full p-3 text-sm rounded-md border transition-colors text-left ${
                          settings.fontFamily === option.value
                            ? 'badge-primary'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
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
                    <Eye className="metadata-icon" />
                    <label className="text-body-sm font-semibold text-neutral-900">
                      Kontrast
                    </label>
                  </div>
                  <div className="space-y-2">
                    {contrastOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ contrastMode: option.value })}
                        className={`w-full p-3 text-sm rounded-md border transition-colors text-left ${
                          settings.contrastMode === option.value
                            ? 'badge-primary'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TTS Voice Selection */}
                {voicesForLanguage.length > 0 && (
                  <div className="divider pt-4">
                    <div className="flex items-center mb-3">
                      <Volume2 className="metadata-icon" />
                      <label className="text-body-sm font-semibold text-neutral-900">
                        Sprachstimme
                      </label>
                    </div>
                    <select
                      value={ttsSettings.selectedVoiceIndex}
                      onChange={(e) => updateTTSSettings({ selectedVoiceIndex: parseInt(e.target.value) })}
                      className="input-base text-sm"
                    >
                      {voicesForLanguage.map((voice, index) => (
                        <option key={`${voice.voiceURI}-${index}`} value={index}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* TTS Speed Control */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-body-sm font-semibold text-neutral-900">
                      Sprechgeschwindigkeit
                    </label>
                    <span className="text-caption text-neutral-600">{(ttsSettings.rate * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsSettings.rate}
                    onChange={(e) => updateTTSSettings({ rate: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-caption text-neutral-500 mt-1">
                    <span>Langsam</span>
                    <span>Normal</span>
                    <span>Schnell</span>
                  </div>
                </div>

                {/* TTS Pitch Control */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-body-sm font-semibold text-neutral-900">
                      Tonhöhe
                    </label>
                    <span className="text-caption text-neutral-600">{(ttsSettings.pitch * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsSettings.pitch}
                    onChange={(e) => updateTTSSettings({ pitch: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-caption text-neutral-500 mt-1">
                    <span>Tief</span>
                    <span>Normal</span>
                    <span>Hoch</span>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="pt-4 divider">
                  <button
                    onClick={resetSettings}
                    className="w-full btn btn-secondary mt-4"
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