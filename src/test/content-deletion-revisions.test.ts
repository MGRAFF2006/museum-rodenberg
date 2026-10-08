// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';
import { handler, memoryDatabase, wireArgs } from './helpers/convexMemory';

afterEach(() => vi.unstubAllEnvs());

for (const [type, operations] of [['artifact', artifacts], ['exhibition', exhibitions]] as const) {
  describe(`${type} deletion revision guards`, () => {
    function fixture(revision?: number) {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const record = { _id: 'target-id', slug: 'Object', ...(revision === undefined ? {} : { revision }) };
      const memory = memoryDatabase({
        exhibitions: type === 'exhibition' ? [{ ...record, artifactSlugs: ['child'] }] :
          [{ _id: 'parent-id', slug: 'parent', artifactSlugs: ['Object'], revision: 3 }],
        artifacts: type === 'artifact' ? [{ ...record, exhibitionSlug: 'parent' }] :
          [{ _id: 'child-id', slug: 'child', exhibitionSlug: 'Object', revision: 3 }],
        [`${type}_translations`]: [{ _id: 'translation-id', [`${type}Id`]: record._id, language: 'de', title: 'Titel' }],
        media: [{ _id: 'media-id', parentType: type, parentSlug: 'Object' }],
        settings: [{ _id: 'setting-id', key: 'featured_exhibition', value: type === 'exhibition' ? 'Object' : 'parent' }],
      });
      const remove = (changes: Record<string, unknown> = {}) => handler(operations.remove)({ db: memory.db }, wireArgs({
        serverSecret: 'fixture-credential', slug: 'Object', expectedRevision: revision ?? 0,
        expectedDocumentId: record._id, ...changes,
      }));
      return { memory, remove };
    }

    it.each([
      { expectedRevision: undefined, expectedDocumentId: undefined },
      { expectedRevision: undefined },
      { expectedDocumentId: undefined },
      { expectedRevision: 2 },
      { expectedDocumentId: 'other-document' },
    ])('rejects a missing or mismatched expectation before any related writes: %j', async (changes) => {
      const { memory, remove } = fixture(4);
      const before = structuredClone(memory.tables);
      await expect(remove(changes)).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.tables).toEqual(before);
      expect(memory.writes).toEqual([]);
    });

    it('accepts a matching legacy revision zero and retains related revision updates', async () => {
      const { memory, remove } = fixture();
      await remove();
      expect(memory.tables[`${type}s`].some(row => row._id === 'target-id')).toBe(false);
      expect(memory.tables[`${type}_translations`]).toEqual([]);
      expect(memory.tables.media).toEqual([]);
      if (type === 'artifact') {
        expect(memory.tables.exhibitions[0]).toMatchObject({ artifactSlugs: [], revision: 4 });
      } else {
        expect(memory.tables.artifacts[0]).not.toHaveProperty('exhibitionSlug');
        expect(memory.tables.artifacts[0].revision).toBe(4);
      }
      const writes = JSON.stringify(memory.writes);
      expect(writes).not.toContain('expectedRevision');
      expect(writes).not.toContain('expectedDocumentId');
      expect(writes).not.toContain('fixture-credential');
    });

    it('reports a conflict when the captured document has already been deleted', async () => {
      const { memory, remove } = fixture();
      await memory.db.delete('target-id');
      const before = structuredClone(memory.tables);
      memory.writes.length = 0;
      await expect(remove()).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.tables).toEqual(before);
      expect(memory.writes).toEqual([]);
    });

    it('does not delete a replacement at the same slug and revision', async () => {
      const { memory, remove } = fixture();
      const draft = { serverSecret: 'fixture-credential', slug: 'Object', qrCode: '', image: '',
        translations: [{ language: 'de', title: 'Replacement', description: '' }],
        ...(type === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}),
      };
      await remove();
      const replacement = await handler(operations.save)({ db: memory.db }, wireArgs(draft));
      expect(replacement).not.toBe('target-id');
      expect(memory.tables[`${type}s`].find(row => row._id === replacement)?.revision).toBe(0);
      const before = structuredClone(memory.tables);
      memory.writes.length = 0;
      await expect(remove()).rejects.toMatchObject({ data: { code: 'STALE_CONTENT' } });
      expect(memory.tables).toEqual(before);
      expect(memory.writes).toEqual([]);
    });
  });
}
