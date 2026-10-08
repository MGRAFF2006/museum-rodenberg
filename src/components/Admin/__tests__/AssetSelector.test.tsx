import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AssetPicker, type AssetType } from '../AssetSelector';
import { getToken, setToken } from '../../../utils/auth';

const { saveAsset } = vi.hoisted(() => ({ saveAsset: vi.fn().mockResolvedValue(true) }));
vi.mock('../../../hooks/useAssets', () => ({
  useAssets: () => ({ assets: [], isLoading: false, saveAsset }),
}));
vi.mock('../../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  saveAsset.mockClear();
});

async function upload(assetType: AssetType) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<AssetPicker isOpen onSelect={onSelect} onClose={onClose} assetType={assetType} />);
  const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
  fireEvent.click(screen.getByRole('button', { name: 'uploadNew' }));
  const input = click.mock.contexts[0] as HTMLInputElement;
  const file = new File(['fixture'], 'fixture.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { value: [file] });
  await act(async () => { fireEvent.change(input); });
  return { onSelect, onClose, file, input };
}

it.each<AssetType>(['image', 'audio', 'video', 'all'])('authenticates %s picker uploads and selects saved assets', async assetType => {
  setToken('browser-session');
  const asset = { id: 'fixture', name: 'fixture.png', alt: 'fixture', url: '/uploads/fixture.png', type: 'image' };
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ assets: [asset] })));
  vi.stubGlobal('fetch', fetch);
  const { onSelect, onClose, file } = await upload(assetType);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(assetType === 'image' ? '/api/upload-image' : '/api/upload-media');
  expect(options.method).toBe('POST');
  expect(options.headers.get('Authorization')).toBe('Bearer browser-session');
  expect(options.headers.has('Content-Type')).toBe(false);
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get(assetType === 'image' ? 'image' : 'file')).toBe(file);
  expect(saveAsset).toHaveBeenCalledExactlyOnceWith(asset);
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('fixture');
  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.queryByRole('alert')).toBeNull();
});

it.each([401, 500])('shows upload failure for HTTP %s without selecting or saving an asset', async status => {
  setToken('rejected-session');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const fetch = vi.fn().mockResolvedValue(new Response('{}', { status }));
  vi.stubGlobal('fetch', fetch);
  const { onSelect, onClose, input } = await upload('image');
  expect(screen.getByRole('alert').textContent).toContain(status === 401 ? 'Please log in again' : 'Upload failed');
  expect(getToken()).toBe(status === 401 ? null : 'rejected-session');
  expect(saveAsset).not.toHaveBeenCalled();
  expect(onSelect).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  setToken('retry-session');
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ assets: [{ id: 'retry' }] })));
  await act(async () => { fireEvent.change(input); });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('retry');
});
