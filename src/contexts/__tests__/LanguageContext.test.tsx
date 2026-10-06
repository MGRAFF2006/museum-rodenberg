import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '../LanguageContext';
const pending = new Map<string, (response: Response) => void>();
function Fixture() {
  const { changeLanguage, t, currentLanguage, loading } = useLanguage();
  return <><button onClick={() => changeLanguage('en')}>English</button><button onClick={() => changeLanguage('fr')}>French</button><output>{currentLanguage}:{t('label')}:{String(loading)}</output></>;
}
function setup() {
  localStorage.clear();
  pending.clear();
  vi.stubGlobal('fetch', vi.fn((url: string) => new Promise<Response>(resolve => pending.set(url.split('?')[0], resolve))));
  render(<LanguageProvider><Fixture /></LanguageProvider>);
}
async function finish(lang: string, body: object, status = 200) {
  await act(async () => { pending.get(`/translations/${lang}.json`)!(new Response(JSON.stringify(body), { status })); });
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('ignores stale selected-language responses and updates the document language', async () => {
  setup();
  await finish('de', { label: 'Deutsch' });
  fireEvent.click(screen.getByText('English'));
  fireEvent.click(screen.getByText('French'));
  await finish('fr', { label: 'Français' });
  await finish('en', { label: 'English' });
  expect(screen.getByRole('status').textContent).toBe('fr:Français:false');
  expect(document.documentElement.lang).toBe('fr');
});
it.each([404, 500])('falls back to German immediately during a switch and after HTTP %i', async status => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setup();
  await finish('de', { label: 'Deutsch' });
  fireEvent.click(screen.getByText('English'));
  await finish('en', { label: 'English' });
  fireEvent.click(screen.getByText('French'));
  expect(screen.getByRole('status').textContent).toContain('fr:Deutsch:');
  await finish('fr', {}, status);
  expect(screen.getByRole('status').textContent).toBe('fr:Deutsch:false');
});
it('settles loading even when the German fallback request fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setup();
  await finish('de', {}, 503);
  expect(screen.getByRole('status').textContent).toBe('de:label:false');
});
