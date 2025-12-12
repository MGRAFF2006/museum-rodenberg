import { useState, useCallback, useEffect } from 'react';

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
  index: number;
}

export interface TTSSettings {
  rate: number;
  pitch: number;
  volume: number;
  selectedVoiceIndex: number;
}

const languageToLocale = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
} as const;

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>({
    rate: 0.9,
    pitch: 1,
    volume: 1,
    selectedVoiceIndex: 0,
  });

  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (supported) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices as unknown as TTSVoice[]);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const getVoicesForLanguage = useCallback((language: string) => {
    const locale = (languageToLocale[language as keyof typeof languageToLocale] || 'de-DE');
    return availableVoices.filter(voice => voice.lang.startsWith(locale.split('-')[0]));
  }, [availableVoices]);

  const speak = useCallback(
    (text: string, language: string = 'de') => {
      if (!isSupported) return;

      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const locale = (languageToLocale[language as keyof typeof languageToLocale] || 'de-DE');
      
      utterance.lang = locale;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      // Set specific voice if available
      const voicesForLang = getVoicesForLanguage(language);
      if (voicesForLang.length > settings.selectedVoiceIndex) {
        utterance.voice = voicesForLang[settings.selectedVoiceIndex];
      } else if (availableVoices.length > settings.selectedVoiceIndex) {
        utterance.voice = availableVoices[settings.selectedVoiceIndex];
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, settings, getVoicesForLanguage, availableVoices]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    availableVoices,
    getVoicesForLanguage,
    settings,
    updateSettings,
  };
};