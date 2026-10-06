import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useAccessibility } from '../useAccessibility';
import { TextToSpeechProvider, useTextToSpeech } from '../useTextToSpeech';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
it('preserves saved accessibility settings through StrictMode effect replay', () => {
  const saved = { fontSize: 'large', fontFamily: 'dyslexie', contrastMode: 'high' };
  localStorage.setItem('accessibility-settings', JSON.stringify(saved));
  const { result } = renderHook(useAccessibility, { wrapper: StrictMode });
  expect(result.current.settings).toEqual(saved);
  expect(JSON.parse(localStorage.getItem('accessibility-settings')!)).toEqual(saved);
  expect(document.documentElement.dataset.fontSize).toBe('large');
});
it('keeps accessibility and speech state usable when storage access throws', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
  const access = renderHook(useAccessibility);
  act(() => access.result.current.updateSettings({ fontSize: 'large' }));
  expect(access.result.current.settings.fontSize).toBe('large');
  const speech = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
  act(() => speech.result.current.updateSettings({ rate: 1.2 }));
  expect(speech.result.current.settings.rate).toBe(1.2);
});
it('keeps language selection usable when storage access throws', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full'); });
  const { result } = renderHook(useLanguage, { wrapper: LanguageProvider });
  act(() => result.current.changeLanguage('fr'));
  expect(result.current.currentLanguage).toBe('fr');
});
it.each(['null', '{}', '{"rate":"fast","pitch":9,"volume":-1,"selectedVoiceIndex":-2}', 'broken'])('repairs invalid speech preferences %s', value => {
  localStorage.setItem('tts-settings', value);
  const { result } = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
  expect(result.current.settings).toEqual({ rate: 0.9, pitch: 1, volume: 1, selectedVoiceIndex: 0 });
});
it('merges valid partial speech preferences with defaults', () => {
  localStorage.setItem('tts-settings', '{"rate":1.2,"extra":"ignored"}');
  const { result } = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
  expect(result.current.settings).toEqual({ rate: 1.2, pitch: 1, volume: 1, selectedVoiceIndex: 0 });
});
