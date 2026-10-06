import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextToSpeechProvider } from '../../hooks/useTextToSpeech';
import { TextToSpeechButton } from '../TextToSpeechButton';

vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
let utterances: SpeechSynthesisUtterance[];
let cancel: ReturnType<typeof vi.fn>;
const voice = { name: 'German', lang: 'de-DE', voiceURI: 'de', default: true };

beforeEach(() => {
  localStorage.clear();
  utterances = [];
  cancel = vi.fn();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [voice], cancel, pending: false, speaking: false,
    speak: (utterance: SpeechSynthesisUtterance) => {
      utterances.push(utterance);
      utterance.onstart?.({} as SpeechSynthesisEvent);
    },
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function reading(text = 'Object history', language: 'de' | 'en' = 'de') {
  return <TextToSpeechProvider><TextToSpeechButton text={text} language={language} /></TextToSpeechProvider>;
}
function error(utterance: SpeechSynthesisUtterance) {
  act(() => utterance.onerror?.({ error: 'synthesis-failed' } as SpeechSynthesisErrorEvent));
}

describe('speech recovery and source lifecycle', () => {
  it('allows a second click to retry after a transient engine failure', () => {
    render(reading());
    fireEvent.click(screen.getByRole('button', { name: 'readAloud' }));
    error(utterances[0]);
    fireEvent.click(screen.getByRole('button', { name: 'ttsError' }));
    expect(utterances).toHaveLength(2);
    expect(utterances[1].text).toBe('Object history');
    expect(screen.getByRole('button', { name: 'stop' })).toBeInTheDocument();
  });

  it('stops reading when its button disappears while keeping the global provider mounted', () => {
    const view = (visible: boolean) => <TextToSpeechProvider>{visible && <TextToSpeechButton text="History" language="de" />}</TextToSpeechProvider>;
    const { rerender } = render(view(true));
    fireEvent.click(screen.getByRole('button', { name: 'readAloud' }));
    cancel.mockClear();
    rerender(view(false));
    expect(cancel).toHaveBeenCalledOnce();
    error(utterances[0]);
    rerender(view(true));
    expect(screen.getByRole('button', { name: 'readAloud' })).toBeInTheDocument();
  });

  it.each(['text', 'language'] as const)('stops reading when the source %s changes', change => {
    const { rerender } = render(reading());
    fireEvent.click(screen.getByRole('button', { name: 'readAloud' }));
    cancel.mockClear();
    rerender(reading(change === 'text' ? 'Another object' : 'Object history', change === 'language' ? 'en' : 'de'));
    expect(cancel).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'readAloud' })).toBeInTheDocument();
  });

  it('does not cancel another source when an unrelated reading button disappears', () => {
    const view = (showOther: boolean) => <TextToSpeechProvider>
      <TextToSpeechButton text="Active history" language="de" />
      {showOther && <TextToSpeechButton text="Other history" language="de" />}
    </TextToSpeechProvider>;
    const { rerender } = render(view(true));
    fireEvent.click(screen.getAllByRole('button', { name: 'readAloud' })[0]);
    cancel.mockClear();
    rerender(view(false));
    expect(cancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'stop' })).toBeInTheDocument();
  });

  it('ignores stale engine events after stopping and restarting speech', () => {
    render(reading());
    fireEvent.click(screen.getByRole('button', { name: 'readAloud' }));
    const old = utterances[0];
    fireEvent.click(screen.getByRole('button', { name: 'stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'readAloud' }));
    error(old);
    act(() => old.onend?.({} as SpeechSynthesisEvent));
    expect(screen.getByRole('button', { name: 'stop' })).toBeInTheDocument();
  });
});
