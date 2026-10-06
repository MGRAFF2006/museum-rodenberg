// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as exhibitions from '../../convex/exhibitions';

const credential = 'fixture-content-secret';
const handler = (mutation: typeof exhibitions.save | typeof exhibitions.remove | typeof exhibitions.setFeatured) =>
  (mutation as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;

function fixture() {
  const rows: Record<string, Record<string, unknown>[]> = {
    exhibitions: [
      { _id: 'ex-a', slug: 'a', isFeatured: true, artifactSlugs: [] },
      { _id: 'ex-b', slug: 'b', isFeatured: false, artifactSlugs: [] },
      { _id: 'ex-c', slug: 'c', isFeatured: false, artifactSlugs: [] },
    ],
    settings: [
      { _id: 'featured', key: 'featured_exhibition', value: 'a' },
      { _id: 'other-setting', key: 'other', value: 'preserve-me' },
    ],
    exhibition_translations: [{ _id: 'translation', exhibitionId: 'ex-a' }],
    media: [{ _id: 'media', parentType: 'exhibition', parentSlug: 'a' }],
    artifacts: [{ _id: 'child', slug: 'child', exhibitionSlug: 'a' }],
  };
  let nextId = 0;
  const db = {
    query(table: string) {
      let matches = rows[table];
      const chain = {
        withIndex(_name: string, filter: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) {
          const q = { eq(field: string, value: unknown) { matches = matches.filter(row => row[field] === value); return q; } };
          filter(q);
          return chain;
        },
        first: async () => matches[0] ? structuredClone(matches[0]) : null,
        collect: async () => structuredClone(matches),
      };
      return chain;
    },
    async patch(id: string, fields: Record<string, unknown>) {
      const row = Object.values(rows).flat().find(row => row._id === id)!;
      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) delete row[key];
        else row[key] = value;
      }
    },
    async insert(table: string, fields: Record<string, unknown>) {
      const id = `${table}-${++nextId}`;
      rows[table].push({ ...fields, _id: id });
      return id;
    },
    async delete(id: string) {
      for (const table of Object.keys(rows)) rows[table] = rows[table].filter(row => row._id !== id);
    },
  };
  const featured = () => rows.settings.find(row => row.key === 'featured_exhibition')?.value;
  const flagged = () => rows.exhibitions.filter(row => row.isFeatured).map(row => row.slug);
  return { ctx: { db }, rows, featured, flagged };
}

const saveArgs = { serverSecret: credential, slug: 'b', image: '', qrCode: 'B', artifactSlugs: [], expectedRevision: 0, expectedDocumentId: 'ex-b',
  translations: [{ language: 'de', title: 'Ausstellung', description: '' }], mediaItems: [] };
beforeEach(() => vi.stubEnv('CONVEX_WRITE_SECRET', credential));
afterEach(() => vi.unstubAllEnvs());

describe('featured exhibition consistency', () => {
  it('deleting the oldest featured exhibition picks an actual remaining exhibition', async () => {
    const { ctx, rows, featured, flagged } = fixture();
    await handler(exhibitions.remove)(ctx, { serverSecret: credential, slug: 'a' });
    expect(featured()).toBe('b');
    expect(flagged()).toEqual(['b']);
    expect(rows.exhibitions.map(row => row.slug)).toEqual(['b', 'c']);
    expect(rows.exhibition_translations).toEqual([]);
    expect(rows.media).toEqual([]);
    expect(rows.artifacts[0].exhibitionSlug).toBeUndefined();
  });

  it('deleting the last exhibition clears only its featured setting', async () => {
    const { ctx, rows, featured, flagged } = fixture();
    rows.exhibitions = rows.exhibitions.slice(0, 1);
    await handler(exhibitions.remove)(ctx, { serverSecret: credential, slug: 'a' });
    expect(featured()).toBeUndefined();
    expect(flagged()).toEqual([]);
    expect(rows.settings).toEqual([{ _id: 'other-setting', key: 'other', value: 'preserve-me' }]);
  });

  it('saving a featured exhibition reconciles the singleton and every old true flag', async () => {
    const { ctx, rows, featured, flagged } = fixture();
    rows.exhibitions[2].isFeatured = true;
    await handler(exhibitions.save)(ctx, { ...saveArgs, isFeatured: true });
    expect(featured()).toBe('b');
    expect(flagged()).toEqual(['b']);
    await handler(exhibitions.save)(ctx, { ...saveArgs, expectedRevision: 1, isFeatured: true });
    expect(rows.settings.filter(row => row.key === 'featured_exhibition')).toHaveLength(1);
  });

  it('creates a featured exhibition and its setting when neither exists', async () => {
    const { ctx, rows, featured, flagged } = fixture();
    rows.settings = rows.settings.filter(row => row.key !== 'featured_exhibition');
    await handler(exhibitions.save)(ctx, { ...saveArgs, slug: 'created', expectedRevision: undefined, expectedDocumentId: undefined, isFeatured: true });
    expect(featured()).toBe('created');
    expect(flagged()).toEqual(['created']);
  });

  it('explicitly unfeaturing the current exhibition clears the singleton and stale flags', async () => {
    const { ctx, featured, flagged } = fixture();
    await handler(exhibitions.save)(ctx, { ...saveArgs, slug: 'a', expectedDocumentId: 'ex-a', isFeatured: false });
    expect(featured()).toBeUndefined();
    expect(flagged()).toEqual([]);
  });

  it('saving or deleting a different nonfeatured exhibition preserves the selected exhibition', async () => {
    const { ctx, featured, flagged } = fixture();
    await handler(exhibitions.save)(ctx, { ...saveArgs, isFeatured: false });
    await handler(exhibitions.remove)(ctx, { serverSecret: credential, slug: 'b' });
    expect(featured()).toBe('a');
    expect(flagged()).toEqual(['a']);
  });

  it('setFeatured updates both representations and rejects absent targets before writing', async () => {
    const { ctx, rows, featured, flagged } = fixture();
    await handler(exhibitions.setFeatured)(ctx, { serverSecret: credential, slug: 'c' });
    expect(featured()).toBe('c');
    expect(flagged()).toEqual(['c']);
    const before = JSON.stringify(rows);
    await expect(handler(exhibitions.setFeatured)(ctx, { serverSecret: credential, slug: 'missing' })).rejects.toThrow('Exhibition not found');
    expect(JSON.stringify(rows)).toBe(before);
  });

  it('rejects unauthorized featured changes before database writes', async () => {
    const { ctx, rows } = fixture();
    const before = JSON.stringify(rows);
    for (const mutation of [exhibitions.save, exhibitions.remove, exhibitions.setFeatured]) {
      await expect(handler(mutation)(ctx, { ...saveArgs, serverSecret: undefined, isFeatured: true })).rejects.toThrow('authorization required');
    }
    expect(JSON.stringify(rows)).toBe(before);
  });

  it('invalidates old drafts when feature flags change and does not bump repeated selections', async () => {
    const { ctx, rows } = fixture();
    const oldDraft = { ...saveArgs, slug: 'a', expectedDocumentId: 'ex-a', isFeatured: true };
    await handler(exhibitions.setFeatured)(ctx, { serverSecret: credential, slug: 'c' });
    expect(rows.exhibitions.map(row => row.revision)).toEqual([1, undefined, 1]);
    const before = JSON.stringify(rows);
    await expect(handler(exhibitions.save)(ctx, oldDraft)).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
    expect(JSON.stringify(rows)).toBe(before);
    await handler(exhibitions.setFeatured)(ctx, { serverSecret: credential, slug: 'c' });
    expect(rows.exhibitions.map(row => row.revision)).toEqual([1, undefined, 1]);
  });

  it('bumps replacement feature and detached child snapshots when deleting the selected exhibition', async () => {
    const { ctx, rows } = fixture();
    await handler(exhibitions.remove)(ctx, { serverSecret: credential, slug: 'a' });
    expect(rows.exhibitions.map(row => row.revision)).toEqual([1, undefined]);
    expect(rows.artifacts[0]).toMatchObject({ revision: 1 });
    expect(rows.artifacts[0]).not.toHaveProperty('exhibitionSlug');
  });

});
