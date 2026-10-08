// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';
import { handler, memoryDatabase, wireArgs } from './helpers/convexMemory';

afterEach(() => vi.unstubAllEnvs());

for (const [type, operations] of [['artifact', artifacts], ['exhibition', exhibitions]] as const) {
  describe(`${type} revision guards`, () => {
    function draft() {
      return {
        serverSecret: 'fixture-credential', slug: 'object', qrCode: 'qr', image: 'photo',
        ...(type === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}),
        translations: [{ language: 'de', title: 'Initial', description: 'Story' }],
        mediaItems: [{ mediaType: 'image', url: 'photo', sortOrder: 0 }],
      };
    }

    it('preserves the first editor save and rejects the second before any partial writes', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      await handler(operations.save)({ db: memory.db }, wireArgs(draft()));
      const initial = await handler(operations.getBySlug)({ db: memory.db }, { slug: 'object' }) as { revision: number; _id: string };
      expect(initial.revision).toBe(0);
      const first = { ...draft(), expectedRevision: initial.revision, expectedDocumentId: initial._id, image: 'first-photo',
        translations: [{ language: 'de', title: 'First curator', description: 'First story' }], mediaItems: [] };
      const second = { ...draft(), expectedRevision: initial.revision, expectedDocumentId: initial._id, image: 'second-photo',
        replaceTranslations: true, translations: [{ language: 'de', title: 'Stale replacement', description: '' }], mediaItems: [] };
      await handler(operations.save)({ db: memory.db }, wireArgs(first));
      const before = structuredClone(memory.tables);
      memory.writes.length = 0;
      await expect(handler(operations.save)({ db: memory.db }, wireArgs(second))).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.writes).toEqual([]);
      expect(memory.tables).toEqual(before);
      const latest = await handler(operations.getBySlug)({ db: memory.db }, { slug: 'object' }) as { revision: number; image: string };
      expect(latest).toMatchObject({ revision: 1, image: 'first-photo' });
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...second, expectedRevision: latest.revision }));
      expect(memory.tables[`${type}s`][0]).toMatchObject({ revision: 2, image: 'second-photo' });
      expect(memory.tables[`${type}s`][0]).not.toHaveProperty('expectedRevision');
      expect(memory.tables[`${type}s`][0]).not.toHaveProperty('expectedDocumentId');
    });

    it('normalizes legacy records to revision zero and rejects unversioned overwrites', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase({ [`${type}s`]: [{ _id: 'legacy', slug: 'object' }] });
      const record = await handler(operations.getBySlug)({ db: memory.db }, { slug: 'object' });
      expect(record).toMatchObject({ revision: 0 });
      await expect(handler(operations.save)({ db: memory.db }, wireArgs(draft()))).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.writes).toEqual([]);
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), expectedRevision: 0, expectedDocumentId: 'legacy' }));
      expect(memory.tables[`${type}s`][0].revision).toBe(1);
    });

    it('does not recreate a deleted document from a stale draft', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      await expect(handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), expectedRevision: 4 }))).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.writes).toEqual([]);
    });

    it('rejects a stale draft after the same slug is deleted and recreated at the same revision', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      const oldId = await handler(operations.save)({ db: memory.db }, wireArgs(draft()));
      await memory.db.delete(oldId as string);
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), image: 'replacement-photo' }));
      const before = structuredClone(memory.tables);
      memory.writes.length = 0;
      await expect(handler(operations.save)({ db: memory.db }, wireArgs({
        ...draft(), expectedRevision: 0, expectedDocumentId: oldId as string,
      }))).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.tables).toEqual(before);
      expect(memory.writes).toEqual([]);
    });
  });
}
