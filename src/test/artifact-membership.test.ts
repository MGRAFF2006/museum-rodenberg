// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';

const credential = 'fixture-content-secret';
const handler = (mutation: typeof artifacts.save | typeof artifacts.remove) =>
  (mutation as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;

function fixture() {
  const exhibitions = [
    { _id: 'ex-a', slug: 'a', artifactSlugs: ['before', 'item', 'after'] },
    { _id: 'ex-b', slug: 'b', artifactSlugs: ['other'] },
    { _id: 'ex-stale', slug: 'stale', artifactSlugs: ['item'] },
  ];
  const rows: Record<string, Record<string, unknown>[]> = {
    exhibitions,
    artifacts: [{ _id: 'art-item', slug: 'item', exhibitionSlug: 'a', image: '', qrCode: 'ITEM' }],
    artifact_translations: [{ _id: 'translation', artifactId: 'art-item' }],
    media: [{ _id: 'media', parentType: 'artifact', parentSlug: 'item' }],
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
        first: async () => matches[0] ?? null,
        collect: async () => [...matches],
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
  return { ctx: { db }, rows, exhibitions };
}

const saveArgs = { serverSecret: credential, slug: 'item', image: '', qrCode: 'ITEM',
  translations: [{ language: 'de', title: 'Objekt', description: '' }], mediaItems: [] };
beforeEach(() => vi.stubEnv('CONVEX_WRITE_SECRET', credential));
afterEach(() => vi.unstubAllEnvs());

describe('artifact exhibition membership', () => {
  it('moves an artifact, removes every stale listing and appends once to its new parent', async () => {
    const { ctx, rows, exhibitions } = fixture();
    await handler(artifacts.save)(ctx, { ...saveArgs, exhibitionSlug: 'b' });
    await handler(artifacts.save)(ctx, { ...saveArgs, exhibitionSlug: 'b' });
    expect(rows.artifacts[0].exhibitionSlug).toBe('b');
    expect(exhibitions.map(ex => ex.artifactSlugs)).toEqual([['before', 'after'], ['other', 'item'], []]);
    const visitorMembers = exhibitions.map(ex => rows.artifacts.filter(art =>
      ex.artifactSlugs.includes(art.slug as string) || art.exhibitionSlug === ex.slug).map(art => art.slug));
    expect(visitorMembers).toEqual([[], ['item'], []]);
  });

  it('preserves the parent and display order when optional parent is omitted', async () => {
    const { ctx, rows, exhibitions } = fixture();
    await handler(artifacts.save)(ctx, saveArgs);
    expect(rows.artifacts[0].exhibitionSlug).toBe('a');
    expect(exhibitions[0].artifactSlugs).toEqual(['before', 'item', 'after']);
    expect(exhibitions[2].artifactSlugs).toEqual(['item']);
  });

  it('adds a newly created artifact to its parent without disturbing other entries', async () => {
    const { ctx, rows, exhibitions } = fixture();
    await handler(artifacts.save)(ctx, { ...saveArgs, slug: 'new', exhibitionSlug: 'b' });
    expect(rows.artifacts.some(art => art.slug === 'new' && art.exhibitionSlug === 'b')).toBe(true);
    expect(exhibitions[1].artifactSlugs).toEqual(['other', 'new']);
  });

  it('preserves explicit exhibition groupings when an unassigned artifact is saved', async () => {
    const { ctx, rows, exhibitions } = fixture();
    delete rows.artifacts[0].exhibitionSlug;
    const before = exhibitions.map(ex => [...ex.artifactSlugs]);
    await handler(artifacts.save)(ctx, saveArgs);
    expect(exhibitions.map(ex => ex.artifactSlugs)).toEqual(before);
  });

  it('clears every old listing when an explicit empty parent detaches the artifact', async () => {
    const { ctx, exhibitions } = fixture();
    const serialized = JSON.parse(JSON.stringify({ ...saveArgs, exhibitionSlug: '' }));
    await handler(artifacts.save)(ctx, serialized);
    expect(exhibitions.map(ex => ex.artifactSlugs)).toEqual([['before', 'after'], ['other'], []]);
  });

  it('deletes translations, media and all memberships, including after an already missing artifact', async () => {
    const { ctx, rows, exhibitions } = fixture();
    await handler(artifacts.remove)(ctx, { serverSecret: credential, slug: 'item' });
    expect(rows.artifacts).toEqual([]);
    expect(rows.artifact_translations).toEqual([]);
    expect(rows.media).toEqual([]);
    expect(exhibitions.map(ex => ex.artifactSlugs)).toEqual([['before', 'after'], ['other'], []]);
    exhibitions[2].artifactSlugs.push('item');
    await handler(artifacts.remove)(ctx, { serverSecret: credential, slug: 'item' });
    expect(exhibitions[2].artifactSlugs).toEqual([]);
  });

  it('still permits migration-style creation before the target exhibition exists', async () => {
    const { ctx, rows } = fixture();
    await handler(artifacts.save)(ctx, { ...saveArgs, slug: 'future-child', exhibitionSlug: 'future-exhibition' });
    expect(rows.artifacts.some(art => art.slug === 'future-child' && art.exhibitionSlug === 'future-exhibition')).toBe(true);
  });

  it('rejects unauthorized saves and deletes before touching relationships', async () => {
    const { ctx, exhibitions, rows } = fixture();
    const before = JSON.stringify(rows);
    await expect(handler(artifacts.save)(ctx, { ...saveArgs, serverSecret: undefined, exhibitionSlug: 'b' })).rejects.toThrow('authorization required');
    await expect(handler(artifacts.remove)(ctx, { slug: 'item', serverSecret: 'wrong' })).rejects.toThrow('authorization required');
    expect(JSON.stringify(rows)).toBe(before);
    expect(exhibitions[0].artifactSlugs).toContain('item');
  });
});
