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

function savedSettings(): AccessibilitySettings {
  try {
    const saved = JSON.parse(localStorage.getItem('accessibility-settings') || 'null') as Partial<AccessibilitySettings> | null;
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaultSettings;
    return {
      fontSize: ['small', 'medium', 'large', 'extra-large'].includes(saved.fontSize || '') ? saved.fontSize as FontSize : defaultSettings.fontSize,
      fontFamily: saved.fontFamily === 'dyslexie' ? 'dyslexie' : 'default',
      contrastMode: saved.contrastMode === 'high' ? 'high' : 'normal',
    };
  } catch {
    // Preferences are optional when storage is corrupt or unavailable.
    return defaultSettings;
  }
}

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(savedSettings);

  useEffect(() => {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    } catch {
      // Apply settings even when they cannot be persisted.
    }
    
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
