import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaLibrary } from '../MediaLibrary';

vi.mock('../../../hooks/useAssets', () => ({ useAssets: () => ({
  assets: [{ id: 'photo', name: 'Photo', url: '/uploads/photo.jpg', alt: '', type: 'image' }],
  isLoading: false, saveAsset: vi.fn(), deleteAsset: vi.fn(),
}) }));
vi.mock('../../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('media ID clipboard feedback', () => {
  it('waits for the clipboard write before displaying success', async () => {
    let finish: (() => void) | undefined;
    const writeText = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { container } = render(<MediaLibrary />);
    fireEvent.click(screen.getByRole('button', { name: 'copyId' }));
    expect(writeText).toHaveBeenCalledWith('photo');
    expect(container.querySelector('.lucide-check')).not.toBeInTheDocument();
    await act(async () => { finish?.(); });
    expect(container.querySelector('.lucide-check')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(container.querySelector('.lucide-check')).not.toBeInTheDocument();
  });

  it.each(['rejected', 'unavailable'] as const)('offers manual copying when the clipboard is %s', async reason => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: reason === 'rejected'
      ? { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) }
      : undefined });
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue(null);
    const { container } = render(<MediaLibrary />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'copyId' })); });
    expect(container.querySelector('.lucide-check')).not.toBeInTheDocument();
    expect(prompt).toHaveBeenCalledWith('copyId', 'photo');
  });
});
