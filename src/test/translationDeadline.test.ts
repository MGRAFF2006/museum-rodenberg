// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { translate } from '../../server/api-handlers.js';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('propagates an upstream deadline abort instead of hanging indefinitely', async () => {
  const controller = new AbortController();
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal!.addEventListener('abort', () => reject(options.signal!.reason), { once: true });
  })));
  const pending = translate({ text: 'hello', target: 'en' }, 'http://translator.test', undefined);
  const assertion = expect(pending).rejects.toThrow('fixture deadline');
  controller.abort(new Error('fixture deadline'));
  await assertion;
  expect(timeout).toHaveBeenCalledWith(30_000);
});
