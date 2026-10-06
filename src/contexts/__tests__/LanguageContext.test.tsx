import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '../LanguageContext';

type Request = { language: string; signal: AbortSignal; resolve: (response: Response) => void; reject: (reason: Error) => void; done?: boolean };
let requests: Request[];

function Visitor() {
  const { currentLanguage, changeLanguage, t, loading } = useLanguage();
  return <>
    <p data-testid="language">{currentLanguage}</p>
    <p data-testid="message">{t('sample')}</p>
    <p data-testid="loading">{String(loading)}</p>
    {(['de', 'en', 'fr', 'it'] as const).map(language => <button key={language} onClick={() => changeLanguage(language)}>{language}</button>)}
  </>;
}

function mount() { return render(<LanguageProvider><Visitor /></LanguageProvider>); }
function pending(language: string) {
  const request = requests.find(request => request.language === language && !request.done);
  if (!request) throw new Error(`No pending ${language} request`);
  request.done = true;
  return request;
}
async function finish(language: string, sample: string, status = 200) {
  await act(async () => pending(language).resolve({ ok: status === 200, status, json: async () => ({ sample }) } as Response));
}

beforeEach(() => {
  localStorage.clear();
  requests = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn((url: string, options: { signal: AbortSignal }) => new Promise<Response>((resolve, reject) => {
    // Deliberately ignore cancellation, so tests also prove stale completions are guarded.
    requests.push({ language: /\/([^/?]+)\.json/.exec(url)![1], signal: options.signal, resolve, reject });
  })));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('visitor language loading', () => {
  it('loads German by default and declares the visible document language', async () => {
    mount();
    expect(document.documentElement.lang).toBe('de');
    await finish('de', 'Deutsch');
    expect(screen.getByTestId('message')).toHaveTextContent('Deutsch');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('starts in a valid saved language and persists subsequent selection', async () => {
    localStorage.setItem('museum-language', 'fr');
    mount();
    expect(screen.getByTestId('language')).toHaveTextContent('fr');
    expect(document.documentElement.lang).toBe('fr');
    await finish('fr', 'Français');
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('museum-language')).toBe('en');
  });

  it('ignores an older response after rapid language changes, even if fetch ignores abort', async () => {
    mount();
    await finish('de', 'Deutsch');
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    fireEvent.click(screen.getByRole('button', { name: 'fr' }));
    await finish('fr', 'Français');
    await finish('en', 'English');
    expect(screen.getByTestId('language')).toHaveTextContent('fr');
    expect(screen.getByTestId('message')).toHaveTextContent('Français');
    expect(requests.find(request => request.language === 'en')!.signal.aborted).toBe(true);
  });

  it('keeps German when a pending foreign-language request finishes after switching back', async () => {
    mount();
    await finish('de', 'Deutsch');
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    fireEvent.click(screen.getByRole('button', { name: 'de' }));
    await finish('en', 'English');
    expect(screen.getByTestId('message')).toHaveTextContent('Deutsch');
    expect(document.documentElement.lang).toBe('de');
  });

  it.each(['http', 'network', 'json'] as const)('uses German fallback instead of the previous language after a %s failure', async failure => {
    mount();
    await finish('de', 'Deutsch');
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    await finish('en', 'English');
    fireEvent.click(screen.getByRole('button', { name: 'fr' }));
    expect(screen.getByTestId('message')).toHaveTextContent('Deutsch');
    await act(async () => {
      const request = pending('fr');
      if (failure === 'network') request.reject(new Error('Disconnected'));
      else request.resolve({ ok: failure !== 'http', status: 404,
        json: async () => { throw new Error('Invalid JSON'); } } as Response);
    });
    expect(screen.getByTestId('message')).toHaveTextContent('Deutsch');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('language')).toHaveTextContent('fr');
  });

  it('finishes loading if German fallback is unavailable', async () => {
    mount();
    await finish('de', '', 404);
    expect(screen.getByTestId('message')).toHaveTextContent('sample');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('keeps language switching usable when storage reads and writes are denied', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    mount();
    await finish('de', 'Deutsch');
    fireEvent.click(screen.getByRole('button', { name: 'fr' }));
    await finish('fr', 'Français');
    expect(screen.getByTestId('message')).toHaveTextContent('Français');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('cancels pending fallback and selected-language requests on unmount', () => {
    localStorage.setItem('museum-language', 'en');
    const { unmount } = mount();
    unmount();
    expect(requests).toHaveLength(2);
    expect(requests.every(request => request.signal.aborted)).toBe(true);
  });
});
