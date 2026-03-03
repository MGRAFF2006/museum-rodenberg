import React, { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode } from 'react';

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

export type TTSError =
  | 'no-voices'          // speechSynthesis exists but getVoices() returned []
  | 'synthesis-error'    // utterance.onerror fired with a real error
  | null;                // no error

const languageToLocale = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
} as const;

const defaultTTSSettings: TTSSettings = {
  rate: 0.9,
  pitch: 1,
  volume: 1,
  selectedVoiceIndex: 0,
};

const getSettingsFromLocalStorage = (): TTSSettings => {
  const saved = localStorage.getItem('tts-settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return defaultTTSSettings;
};

/** Detect Gecko/Firefox-based browsers (includes Zen, Librewolf, etc.) */
const isGecko = (): boolean =>
  typeof navigator !== 'undefined' && /Gecko\/\d/i.test(navigator.userAgent) && !/like Gecko/i.test(navigator.userAgent);

interface TextToSpeechContextType {
  speak: (text: string, language?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  availableVoices: TTSVoice[];
  getVoicesForLanguage: (language: string) => TTSVoice[];
  settings: TTSSettings;
  updateSettings: (newSettings: Partial<TTSSettings>) => void;
  resetSettings: () => void;
  error: TTSError;
}

const TextToSpeechContext = createContext<TextToSpeechContextType | undefined>(undefined);

export const TextToSpeechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>(getSettingsFromLocalStorage());
  const [error, setError] = useState<TTSError>(null);

  // Keep a ref to the native SpeechSynthesisVoice objects so we never
  // lose their prototype by round-tripping through React state.
  const nativeVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const resumeTimerRef = useRef<number | null>(null);
  // Track whether voices have been loaded at least once (including async load)
  const voicesLoadedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (supported) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        nativeVoicesRef.current = voices;
        voicesLoadedRef.current = true;
        setAvailableVoices(
          voices.map((v, i) => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
            default: v.default,
            index: i,
          }))
        );
        // Clear a previous no-voices error if voices arrived
        if (voices.length > 0) {
          setError(prev => prev === 'no-voices' ? null : prev);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      // If no voices loaded synchronously, assume no-voices until proven
      // otherwise. This lets the UI show the warning icon immediately
      // instead of waiting for the full polling timeout.
      if (nativeVoicesRef.current.length === 0) {
        setError('no-voices');
      }

      // On some browsers, voices load asynchronously but the
      // onvoiceschanged event never fires. Poll a few times as a safety net.
      let attempts = 0;
      const pollId = window.setInterval(() => {
        attempts++;
        if (nativeVoicesRef.current.length > 0 || attempts >= 10) {
          clearInterval(pollId);
          if (nativeVoicesRef.current.length === 0 && attempts >= 10) {
            console.warn(
              '[TTS] No speech synthesis voices available after polling. ' +
              'On Linux, install speech-dispatcher and espeak-ng. ' +
              'In Firefox, check that media.webspeech.synth.enabled is true in about:config.'
            );
          }
          return;
        }
        loadVoices();
      }, 250);

      return () => {
        clearInterval(pollId);
        window.speechSynthesis.cancel();
        if (resumeTimerRef.current !== null) {
          clearInterval(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
      };
    }
  }, []);

  const getVoicesForLanguage = useCallback((language: string) => {
    const locale = (languageToLocale[language as keyof typeof languageToLocale] || language);
    const langPrefix = locale.split('-')[0].toLowerCase();
    return availableVoices.filter(voice =>
      voice.lang.toLowerCase().startsWith(langPrefix) ||
      voice.lang.toLowerCase().includes(langPrefix)
    );
  }, [availableVoices]);

  /** Return the native SpeechSynthesisVoice objects that match a language. */
  const getNativeVoicesForLanguage = useCallback((language: string): SpeechSynthesisVoice[] => {
    const locale = (languageToLocale[language as keyof typeof languageToLocale] || language);
    const langPrefix = locale.split('-')[0].toLowerCase();
    return nativeVoicesRef.current.filter(voice =>
      voice.lang.toLowerCase().startsWith(langPrefix) ||
      voice.lang.toLowerCase().includes(langPrefix)
    );
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  /**
   * Build an utterance and hand it to the speech engine. Must be called
   * synchronously inside a user-gesture call-stack so that Firefox/Zen
   * accept the speak() call (they gate it behind user-activation).
   */
  const fireUtterance = useCallback(
    (text: string, language: string) => {
      const synth = window.speechSynthesis;

      // If no voices are available at all, report the error and bail out
      // rather than calling speak() with no voice (which silently fails).
      if (nativeVoicesRef.current.length === 0) {
        setError('no-voices');
        console.warn('[TTS] Cannot speak: no voices available.');
        return;
      }

      setError(null);

      const utterance = new SpeechSynthesisUtterance(text);
      const locale = (languageToLocale[language as keyof typeof languageToLocale] || language);

      utterance.lang = locale;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      // Use the real native SpeechSynthesisVoice objects (not the
      // serialised copies from state) so the browser accepts them.
      const voicesForLang = getNativeVoicesForLanguage(language);
      if (voicesForLang.length > 0) {
        const idx = settings.selectedVoiceIndex < voicesForLang.length
          ? settings.selectedVoiceIndex
          : 0;
        utterance.voice = voicesForLang[idx];
      } else if (nativeVoicesRef.current.length > 0) {
        // No voice matched the requested language — fall back to the
        // system default voice so we still produce *some* audio instead
        // of silently failing.
        const defaultVoice = nativeVoicesRef.current.find(v => v.default)
          || nativeVoicesRef.current[0];
        utterance.voice = defaultVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        clearResumeTimer();
      };
      utterance.onerror = (event) => {
        // 'canceled' is not a real error — it fires when we call cancel()
        if (event.error !== 'canceled') {
          console.error('[TTS] Speech synthesis error:', event.error);
          setError('synthesis-error');
        }
        setIsSpeaking(false);
        clearResumeTimer();
      };

      synth.speak(utterance);

      // Chromium bug workaround: the engine pauses speech after ~15 s and
      // never resumes on its own. Periodically poking it keeps audio
      // flowing for long texts. Only apply on non-Gecko browsers since
      // Firefox handles long utterances correctly and the pause/resume
      // cycle is unnecessary overhead there.
      if (!isGecko()) {
        resumeTimerRef.current = window.setInterval(() => {
          if (!synth.speaking) {
            clearResumeTimer();
            return;
          }
          synth.pause();
          synth.resume();
        }, 10_000);
      }
    },
    [settings, getNativeVoicesForLanguage, clearResumeTimer]
  );

  const speak = useCallback(
    (text: string, language: string = 'de') => {
      if (!isSupported || !text) return;

      const synth = window.speechSynthesis;

      // Clear resume keepalive from a previous utterance
      clearResumeTimer();

      if (synth.speaking || synth.pending) {
        // Something is currently playing or queued. We need to cancel it
        // before speaking the new text.
        //
        // Firefox/Gecko: cancel() + speak() in the same synchronous tick
        // causes the new utterance to be silently dropped. We MUST NOT
        // call cancel() here — instead, the TextToSpeechButton already
        // calls stop() on the first click (which does the cancel), and
        // then speak() on the second click. So this path should rarely
        // be hit from the button. For programmatic callers that call
        // speak() while something is playing, we cancel and use a
        // microtask delay on Gecko to let the engine settle.
        //
        // Chromium: cancel() + speak() in the same tick works fine.
        synth.cancel();
        if (isGecko()) {
          // On Gecko, give the engine one microtask to process the cancel
          // before we speak again. A microtask (Promise.resolve) is still
          // within the user-activation window (unlike setTimeout), so
          // Firefox will accept the speak() call.
          void Promise.resolve().then(() => {
            fireUtterance(text, language);
          });
        } else {
          fireUtterance(text, language);
        }
      } else {
        // Nothing playing — speak immediately, no cancel needed.
        // This is the common path from TextToSpeechButton and is fully
        // synchronous (critical for Firefox user-activation requirement).
        fireUtterance(text, language);
      }
    },
    [isSupported, fireUtterance, clearResumeTimer]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    clearResumeTimer();
  }, [isSupported, clearResumeTimer]);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultTTSSettings);
  }, []);

  const value: TextToSpeechContextType = {
    speak,
    stop,
    isSpeaking,
    isSupported,
    availableVoices,
    getVoicesForLanguage,
    settings,
    updateSettings,
    resetSettings,
    error,
  };

  return React.createElement(TextToSpeechContext.Provider, { value }, children);
};

export const useTextToSpeech = (): TextToSpeechContextType => {
  const context = useContext(TextToSpeechContext);
  if (context === undefined) {
    throw new Error('useTextToSpeech must be used within a TextToSpeechProvider');
  }
  return context;
};
