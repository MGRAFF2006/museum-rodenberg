// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';
import { findByQRCode } from '../../convex/lookup';
import { handler, memoryDatabase, wireArgs } from './helpers/convexMemory';

afterEach(() => vi.unstubAllEnvs());

for (const [table, operations] of [['artifacts', artifacts], ['exhibitions', exhibitions]] as const) {
  describe(`${table} global QR identities`, () => {
    function draft() {
      return {
        serverSecret: 'fixture-credential', slug: 'object', qrCode: 'QR', image: '',
        ...(table === 'exhibitions' ? { isFeatured: false, artifactSlugs: [] } : {}),
        translations: [{ language: 'de', title: 'Object', description: '' }],
        mediaItems: [],
      };
    }
    it.each(['artifacts', 'exhibitions'])('rejects a new code already owned in %s before writes', async ownerTable => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase({ [ownerTable]: [{ _id: 'owner', slug: 'owner', qrCode: 'QR' }] });
      const before = structuredClone(memory.tables);
      await expect(handler(operations.save)({ db: memory.db }, wireArgs(draft()))).rejects.toMatchObject({ data: { code: 'QR_CONFLICT' } });
      expect(memory.tables).toEqual(before);
      expect(memory.writes).toEqual([]);
    });
    it('allows retaining its own exact QR code and changing to an unused code', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      const _id = await handler(operations.save)({ db: memory.db }, wireArgs(draft()));
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), expectedDocumentId: _id as string, expectedRevision: 0 }));
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), expectedDocumentId: _id as string, expectedRevision: 1, qrCode: 'qr' }));
      expect(memory.tables[table][0]).toMatchObject({ qrCode: 'qr', revision: 2 });
    });
    it('rejects a duplicate even when its own record is the first indexed result', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase({ [table]: [
        { _id: 'self', slug: 'object', qrCode: 'QR', revision: 0 },
        { _id: 'duplicate', slug: 'other', qrCode: 'QR' },
      ] });
      await expect(handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), expectedDocumentId: 'self', expectedRevision: 0 })))
        .rejects.toMatchObject({ data: { code: 'QR_CONFLICT' } });
      expect(memory.writes).toEqual([]);
    });
    it('allows repairing an existing duplicate by selecting an unused QR code', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase({ [table]: [
        { _id: 'self', slug: 'object', qrCode: 'QR', revision: 0 },
        { _id: 'duplicate', slug: 'other', qrCode: 'QR' },
      ] });
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), expectedDocumentId: 'self', expectedRevision: 0, qrCode: 'REPAIRED' }));
      expect(memory.tables[table][0]).toMatchObject({ qrCode: 'REPAIRED', revision: 1 });
    });
    it.each(['', '  '])('allows multiple blank identities (%j) without treating them as assigned codes', async qrCode => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase({ artifacts: [{ _id: 'blank-artifact', slug: 'empty', qrCode }], exhibitions: [{ _id: 'blank-exhibition', slug: 'empty', qrCode }] });
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft(), qrCode }));
      expect(memory.tables[table].find(item => item.slug === 'object')?.qrCode).toBe(qrCode);
    });
  });
}

it.each(['', '  '])('does not resolve a blank QR scan (%j) or access the database', async qrCode => {
  const query = vi.fn(() => { throw new Error('Unexpected query'); });
  expect(await handler(findByQRCode)({ db: { query } }, { qrCode })).toBeNull();
  expect(query).not.toHaveBeenCalled();
});
