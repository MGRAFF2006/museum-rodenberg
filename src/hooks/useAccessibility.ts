import { useState, useEffect } from 'react';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type FontFamily = 'default' | 'dyslexie';
export type ContrastMode = 'normal' | 'high';

interface AccessibilitySettings {
  fontSize: FontSize;
  fontFamily: FontFamily;
  contrastMode: ContrastMode;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  fontFamily: 'default',
  contrastMode: 'normal',
};

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    // Font size
    root.setAttribute('data-font-size', settings.fontSize);
    
    // Font family
    root.setAttribute('data-font-family', settings.fontFamily);
    
    // Contrast mode
    root.setAttribute('data-contrast-mode', settings.contrastMode);
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};