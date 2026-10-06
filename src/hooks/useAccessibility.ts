import { useState, useEffect } from 'react';
import { readJSONPreference, writePreference } from '../utils/preferences';

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
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = readJSONPreference('accessibility-settings');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaultSettings;
    const values = saved as Partial<AccessibilitySettings>;
    return {
      fontSize: ['small', 'medium', 'large', 'extra-large'].includes(values.fontSize || '') ? values.fontSize! : defaultSettings.fontSize,
      fontFamily: ['default', 'dyslexie'].includes(values.fontFamily || '') ? values.fontFamily! : defaultSettings.fontFamily,
      contrastMode: ['normal', 'high'].includes(values.contrastMode || '') ? values.contrastMode! : defaultSettings.contrastMode,
    };
  });

  useEffect(() => {
    writePreference('accessibility-settings', JSON.stringify(settings));
    
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