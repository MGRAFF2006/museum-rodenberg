import { StrictMode } from 'react';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccessibility } from '../useAccessibility';
import { TextToSpeechProvider, useTextToSpeech } from '../useTextToSpeech';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('visitor preference restoration', () => {
  it('restores saved accessibility settings through StrictMode effect replay', () => {
    const saved = { fontSize: 'large', fontFamily: 'dyslexie', contrastMode: 'high' };
    localStorage.setItem('accessibility-settings', JSON.stringify(saved));
    const { result } = renderHook(useAccessibility, { wrapper: StrictMode });
    expect(result.current.settings).toEqual(saved);
    expect(JSON.parse(localStorage.getItem('accessibility-settings')!)).toEqual(saved);
    expect(document.documentElement).toHaveAttribute('data-contrast-mode', 'high');
  });

  it.each(['null', '[]', '"text"', '{invalid', '{"fontSize":"huge","fontFamily":17,"contrastMode":"invalid"}'])('recovers invalid accessibility settings %s', saved => {
    localStorage.setItem('accessibility-settings', saved);
    const { result } = renderHook(useAccessibility);
    expect(result.current.settings).toEqual({ fontSize: 'medium', fontFamily: 'default', contrastMode: 'normal' });
  });

  it.each(['null', '[]', '"text"', '{invalid', '{}'])('recovers invalid or incomplete speech settings %s', saved => {
    localStorage.setItem('tts-settings', saved);
    const { result } = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
    expect(result.current.settings).toEqual({ rate: 0.9, pitch: 1, volume: 1, selectedVoiceIndex: 0 });
  });

  it('clamps numeric speech settings and rejects invalid voice indices', () => {
    localStorage.setItem('tts-settings', JSON.stringify({ rate: 99, pitch: -1, volume: 4, selectedVoiceIndex: -3 }));
    const { result } = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
    expect(result.current.settings).toEqual({ rate: 2, pitch: 0.5, volume: 1, selectedVoiceIndex: 0 });
  });

  it('preserves valid partial settings while defaulting incorrect types', () => {
    localStorage.setItem('tts-settings', JSON.stringify({ rate: 'fast', volume: 0.4, selectedVoiceIndex: 2.5 }));
    const { result } = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
    expect(result.current.settings).toEqual({ rate: 0.9, pitch: 1, volume: 0.4, selectedVoiceIndex: 0 });
  });

  it('keeps accessibility and speech settings usable when storage APIs throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    const accessibility = renderHook(useAccessibility);
    const speech = renderHook(useTextToSpeech, { wrapper: TextToSpeechProvider });
    act(() => {
      accessibility.result.current.updateSettings({ contrastMode: 'high' });
      speech.result.current.updateSettings({ rate: 1.3 });
    });
    expect(document.documentElement).toHaveAttribute('data-contrast-mode', 'high');
    expect(speech.result.current.settings.rate).toBe(1.3);
  });

  it('does not reread speech preferences on every provider rerender', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const view = (text: string) => <TextToSpeechProvider><p>{text}</p></TextToSpeechProvider>;
    const { rerender } = render(view('First'));
    const reads = getItem.mock.calls.filter(([key]) => key === 'tts-settings').length;
    rerender(view('Second'));
    expect(getItem.mock.calls.filter(([key]) => key === 'tts-settings')).toHaveLength(reads);
  });
});
