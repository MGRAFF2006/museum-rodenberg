import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAssetValidation } from '../useAssetValidation';
import type { Asset } from '../../types';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  assets: {} as Record<string, Asset>,
  isLoading: false,
}));
vi.mock('../../utils/auth', () => ({ authFetch: mocks.fetch }));
vi.mock('../useAssets', () => ({ useAssets: () => ({
  isLoading: mocks.isLoading,
  resolveAsset: (reference: string) => mocks.assets[reference],
}) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assets = Object.fromEntries(['photo', 'film', 'sound'].map(id => [id, {
    id, name: id, alt: id, url: `/uploads/${id}.bin`, type: 'image',
  }]));
  mocks.isLoading = false;
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ invalid: [] }) });
});
afterEach(cleanup);

describe('asset reference validation', () => {
  it('resolves IDs across thumbnail, gallery, translated and detailed Markdown and deduplicates paths', async () => {
    const { result } = renderHook(useAssetValidation);
    let valid;
    await act(async () => { valid = await result.current.validateAssets({
      image: 'photo',
      media: { images: ['photo'], videos: [{ url: 'film', title: '', description: '' }], audio: [] },
      translations: { de: { description: '![Photo](photo)', significance: '[Audio: Recording](audio:sound)' } },
      detailedContent: { en: '[Video: Film](video:film)' },
    }); });
    expect(valid).toBe(true);
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).paths).toEqual([
      '/uploads/photo.bin', '/uploads/film.bin', '/uploads/sound.bin',
    ]);
  });

  it('rejects a removed registry ID without passing it as a filesystem path', async () => {
    const { result } = renderHook(useAssetValidation);
    let valid;
    await act(async () => { valid = await result.current.validateAssets({ image: 'removed_photo' }); });
    expect(valid).toBe(false);
    expect(result.current.validationErrors).toEqual(['Unknown asset: removed_photo']);
    expect(result.current.isValidating).toBe(false);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('blocks unresolved IDs while the registry is loading, then uses the arriving registry', async () => {
    mocks.isLoading = true;
    mocks.assets = {};
    const { result, rerender } = renderHook(useAssetValidation);
    await act(async () => { expect(await result.current.validateAssets({ image: 'photo' })).toBe(false); });
    expect(result.current.validationErrors[0]).toContain('still loading');
    mocks.isLoading = false;
    mocks.assets.photo = { id: 'photo', name: 'Photo', alt: '', url: '/uploads/photo.jpg', type: 'image' };
    rerender();
    await act(async () => { expect(await result.current.validateAssets({ image: 'photo' })).toBe(true); });
    expect(result.current.validationErrors).toEqual([]);
  });

  it('rejects a registered ID whose uploaded file is missing', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ invalid: ['/uploads/photo.bin'] }) });
    const { result } = renderHook(useAssetValidation);
    await act(async () => { expect(await result.current.validateAssets({ image: 'photo' })).toBe(false); });
    expect(result.current.validationErrors).toEqual(['Missing asset: /uploads/photo.bin']);
  });

  it('preserves direct local paths and allows external media without probing remote services', async () => {
    const { result } = renderHook(useAssetValidation);
    await act(async () => { expect(await result.current.validateAssets({
      image: 'https://example.org/photo.jpg',
      media: { images: ['/uploads/direct.jpg', '/images/static.jpg'], audio: [], videos: [] },
    })).toBe(true); });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).paths).toEqual(['/uploads/direct.jpg']);
  });

  it('blocks saving and clears pending validation after a server failure', async () => {
    mocks.fetch.mockResolvedValue({ ok: false });
    const { result } = renderHook(useAssetValidation);
    await act(async () => { expect(await result.current.validateAssets({ image: 'photo' })).toBe(false); });
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationErrors).toHaveLength(1);
  });
});
