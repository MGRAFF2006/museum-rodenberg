// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';

const credential = 'fixture-content-secret';
const writes = [artifacts.save, exhibitions.save];
const handler = (mutation: typeof artifacts.save | typeof exhibitions.save) =>
  (mutation as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
const args = {
  serverSecret: credential, slug: 'fixture', qrCode: 'FIXTURE', image: '',
  artifactSlugs: [], isFeatured: false,
  translations: [{ language: 'de', title: 'Deutscher Titel', description: '' }],
};
beforeEach(() => vi.stubEnv('CONVEX_WRITE_SECRET', credential));
afterEach(() => vi.unstubAllEnvs());

function database() {
  const insert = vi.fn<(table: string, fields: Record<string, unknown>) => Promise<string>>(async () => 'fixture-id');
  const patch = vi.fn();
  const chain = { withIndex: () => chain, first: async () => null, collect: async () => [] };
  const query = vi.fn(() => chain);
  return { ctx: { db: { query, insert, patch } }, query, insert, patch };
}

describe('content save input validation', () => {
  it.each(['', ' ', 'has space', '/nested', 'parent/child', '.', '..', 'new', 'encoded%2Fpath', 'query?x', 'hash#x', 'ä'])('rejects unsafe or reserved ID %j before database access', async slug => {
    for (const write of writes) {
      const { ctx, query, insert, patch } = database();
      await expect(handler(write)(ctx, { ...args, slug })).rejects.toThrow('Content ID must');
      expect(query).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
      expect(patch).not.toHaveBeenCalled();
    }
  });

  it.each([
    { translations: [] },
    { translations: [{ language: 'en', title: 'English title', description: '' }] },
    { translations: [{ language: 'de', title: '', description: '' }] },
    { translations: [{ language: 'de', title: ' \n\t ', description: '' }] },
    { translations: [{ language: 'de', title: 'Valid', description: '' }, { language: 'de', title: ' ', description: '' }] },
  ])('requires German content with a nonblank title: $translations', async ({ translations }) => {
    for (const write of writes) {
      const { ctx, query } = database();
      await expect(handler(write)(ctx, { ...args, translations })).rejects.toThrow('German title');
      expect(query).not.toHaveBeenCalled();
    }
  });

  it.each(['lowercase-slug', 'Mixed_Case_legacy', 'existing_123'])('preserves compatible ID %s without silently changing identity', async slug => {
    for (const write of writes) {
      const { ctx, insert } = database();
      await handler(write)(ctx, { ...args, slug });
      expect(insert.mock.calls.some(call => call[0] === (write === artifacts.save ? 'artifacts' : 'exhibitions') && call[1].slug === slug)).toBe(true);
    }
  });

  it('accepts every committed seed ID and its German title using actual save handlers', async () => {
    for (const [file, table, write] of [
      ['artifacts.json', 'artifacts', artifacts.save],
      ['exhibitions.json', 'exhibitions', exhibitions.save],
    ] as const) {
      const data = JSON.parse(readFileSync(new URL(`../content/${file}`, import.meta.url), 'utf8'))[table] as
        Record<string, { translations: Record<string, { title: string; description: string }> }>;
      for (const [slug, content] of Object.entries(data)) {
        const { ctx } = database();
        const translations = Object.entries(content.translations).map(([language, value]) => ({ language, title: value.title, description: value.description }));
        await expect(handler(write)(ctx, { ...args, slug, translations })).resolves.toBe('fixture-id');
      }
    }
  });

  it('still authorizes before revealing input errors', async () => {
    for (const write of writes) {
      const { ctx, query } = database();
      await expect(handler(write)(ctx, { ...args, slug: '/', translations: [], serverSecret: undefined })).rejects.toThrow('authorization required');
      expect(query).not.toHaveBeenCalled();
    }
  });
});
