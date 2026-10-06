import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VisualEditor } from '../components/Admin/VisualEditor';
import { ContentProvider } from '../contexts/ContentContext';
import { getFunctionName } from 'convex/server';
import type { Asset } from '../types';

let asset: Asset;
let registryAvailable = true;
vi.mock('../hooks/useLanguage', () => ({ useLanguage: () => ({ currentLanguage: 'de', t: (key: string) => key }) }));
vi.mock('../hooks/useAssets', () => ({ useAssets: () => ({ resolveAsset: () => asset }) }));
vi.mock('convex/react', () => ({ useQuery: (query: Parameters<typeof getFunctionName>[0]) =>
  getFunctionName(query) === 'assets:list' ? registryAvailable ? [{ _id: 'stored-asset', assetId: asset.id, name: asset.name, alt: asset.alt, url: asset.url, type: asset.type }] : undefined : [],
}));
vi.mock('../components/Admin/AssetSelector', () => ({ AssetPicker: ({ isOpen, onSelect }: { isOpen: boolean; onSelect: (id: string) => void }) =>
  isOpen ? <button onClick={() => onSelect(asset.id)}>Select asset</button> : null,
}));

beforeEach(() => {
  registryAvailable = true;
  asset = { id: 'asset-id', name: 'Name <with> [brackets]', alt: 'Image description', url: '/uploads/photo.jpg', type: 'image' };
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { value: () => new DOMRect(), configurable: true });
  Object.defineProperty(Range.prototype, 'getClientRects', { value: () => [], configurable: true });
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: vi.fn(), configurable: true });
});

it('updates an existing image preview when its registry finishes loading without changing content', async () => {
  registryAvailable = false;
  const onChange = vi.fn();
  const view = render(editor('![Image description](asset-id)', onChange));
  expect(await screen.findByAltText('Image description')).toHaveAttribute('src', 'asset-id');
  registryAvailable = true;
  view.rerender(editor('![Image description](asset-id)', onChange));
  expect(screen.getByAltText('Image description')).toHaveAttribute('src', '/uploads/photo.jpg');
  expect(onChange).not.toHaveBeenCalled();
});

function editor(content: string, onChange: (value: string) => void) {
  return <ContentProvider><VisualEditor content={content} onChange={onChange} /></ContentProvider>;
}

it.each(['audio', 'video'] as const)('serializes selected %s as a real custom Markdown link', async (type) => {
  asset.type = type;
  const onChange = vi.fn();
  render(editor('', onChange));
  fireEvent.click(await screen.findByTitle('insertMedia'));
  fireEvent.click(screen.getByRole('button', { name: 'Select asset' }));
  const markdown = onChange.mock.calls[onChange.mock.calls.length - 1][0] as string;
  expect(markdown).toContain(`](${type}:asset-id)`);
  expect(markdown).not.toContain('&lt;a');
  const link = document.querySelector('.tiptap a')!;
  expect(link).toHaveAttribute('href', `${type}:asset-id`);
  expect(link.textContent).toContain(asset.name);
});

it.each(['audio', 'video'] as const)('loads a persisted %s link as a link rather than literal markup', async (type) => {
  render(editor(`[Narration](${type}:asset-id)`, () => {}));
  expect(await screen.findByRole('link', { name: 'Narration' })).toHaveAttribute('href', `${type}:asset-id`);
});

it('previews resolved image bytes while serializing its stable asset ID', async () => {
  const onChange = vi.fn();
  render(editor('', onChange));
  fireEvent.click(await screen.findByTitle('insertMedia'));
  fireEvent.click(screen.getByRole('button', { name: 'Select asset' }));
  expect(await screen.findByAltText('Image description')).toHaveAttribute('src', '/uploads/photo.jpg');
  expect(onChange.mock.calls[onChange.mock.calls.length - 1][0]).toBe('![Image description](asset-id)');
});

it('resolves an existing image again when the asset registry changes', async () => {
  const onChange = vi.fn();
  const view = render(editor('![Image description](asset-id)', onChange));
  expect(await screen.findByAltText('Image description')).toHaveAttribute('src', '/uploads/photo.jpg');
  asset = { ...asset, url: '/uploads/replaced.jpg' };
  view.rerender(editor('![Image description](asset-id)', onChange));
  expect(screen.getByAltText('Image description')).toHaveAttribute('src', '/uploads/replaced.jpg');
});

it('offers supported Markdown formatting without creating duplicate extensions or new underline', async () => {
  const warn = vi.spyOn(console, 'warn');
  render(editor('', () => {}));
  await screen.findByTitle('bold');
  expect(screen.queryByTitle('underline')).not.toBeInTheDocument();
  expect(warn.mock.calls.some(([message]) => String(message).includes('Duplicate extension names'))).toBe(false);
  warn.mockRestore();
});

it('preserves legacy underlined words while saving supported plain Markdown', async () => {
  const onChange = vi.fn();
  render(editor('<u>Legacy words</u>', onChange));
  fireEvent.click(await screen.findByTitle('insertMedia'));
  fireEvent.click(screen.getByRole('button', { name: 'Select asset' }));
  const markdown = onChange.mock.calls[onChange.mock.calls.length - 1][0] as string;
  expect(markdown).toContain('Legacy words');
  expect(markdown).not.toContain('<u>');
  expect(markdown).not.toContain('</u>');
});
