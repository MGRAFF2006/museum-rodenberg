import { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { QRScanner } from '../QRScanner';
const state = vi.hoisted(() => ({ instances: [] as { id: string; clear: ReturnType<typeof vi.fn<() => Promise<void>>>; success?: (value: string) => void; miss?: () => void }[] }));
vi.mock('../../hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('html5-qrcode', () => ({ Html5QrcodeScanner: class {
  instance: typeof state.instances[number];
  constructor(id: string) { this.instance = { id, clear: vi.fn(async () => {}) }; state.instances.push(this.instance); }
  render(success: (value: string) => void, miss: () => void) { this.instance.success = success; this.instance.miss = miss; }
  clear() { return this.instance.clear(); }
} }));
afterEach(async () => { cleanup(); await act(async () => {}); state.instances.length = 0; vi.restoreAllMocks(); });
it('keeps the camera alive across callback rerenders and uses the newest callbacks', async () => {
  const first = vi.fn(); const latest = vi.fn(); const close = vi.fn();
  const view = render(<QRScanner isOpen onClose={close} onScan={first} />);
  await act(async () => {});
  view.rerender(<QRScanner isOpen onClose={close} onScan={latest} />);
  expect(state.instances).toHaveLength(1);
  act(() => { state.instances[0].success!('code'); state.instances[0].success!('duplicate'); });
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledExactlyOnceWith('code');
  expect(close).toHaveBeenCalledOnce();
});
it('waits for async cleanup before reopening the same scanner', async () => {
  const props = { onClose: vi.fn(), onScan: vi.fn() };
  const view = render(<QRScanner isOpen {...props} />);
  await act(async () => {});
  let finish!: () => void;
  state.instances[0].clear.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  view.rerender(<QRScanner isOpen={false} {...props} />);
  await act(async () => {});
  view.rerender(<QRScanner isOpen {...props} />);
  await act(async () => {});
  expect(state.instances).toHaveLength(1);
  await act(async () => finish());
  expect(state.instances).toHaveLength(2);
});
it('does not initialize twice during StrictMode replay or log normal scan misses', async () => {
  const warn = vi.spyOn(console, 'warn');
  render(<StrictMode><QRScanner isOpen onClose={vi.fn()} onScan={vi.fn()} /></StrictMode>);
  await act(async () => {});
  expect(state.instances).toHaveLength(1);
  for (let i = 0; i < 10; i++) state.instances[0].miss!();
  expect(warn).not.toHaveBeenCalled();
});
it('isolates scanner element IDs across unmount/remount', async () => {
  const props = { onClose: vi.fn(), onScan: vi.fn() };
  const view = render(<QRScanner isOpen {...props} />);
  await act(async () => {});
  view.unmount();
  render(<QRScanner isOpen {...props} />);
  await act(async () => {});
  expect(state.instances[0].id).not.toBe(state.instances[1].id);
});
it('handles a rejected stop and blocks another camera on the same lifecycle', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const props = { onClose: vi.fn(), onScan: vi.fn() };
  const view = render(<QRScanner isOpen {...props} />);
  await act(async () => {});
  state.instances[0].clear.mockRejectedValue(new Error('fixture stop failed'));
  view.rerender(<QRScanner isOpen={false} {...props} />);
  await act(async () => {});
  view.rerender(<QRScanner isOpen {...props} />);
  await act(async () => {});
  expect(state.instances).toHaveLength(1);
  expect(view.getByRole('alert')).toHaveTextContent('qrCameraUnavailable');
});
