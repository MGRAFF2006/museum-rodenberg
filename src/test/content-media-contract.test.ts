// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';
import { handler, memoryDatabase, wireArgs } from './helpers/convexMemory';

afterEach(() => vi.unstubAllEnvs());

for (const [type, operations] of [['artifact', artifacts], ['exhibition', exhibitions]] as const) {
  describe(`${type} media update contract`, () => {
    it.each(['omitted', 'empty', 'replacement'] as const)('handles %s media deliberately', async mode => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      const draft = { serverSecret: 'fixture-credential', slug: 'object', qrCode: 'qr', image: '',
        ...(type === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}),
        translations: [{ language: 'de', title: 'Initial title', description: 'Initial story' }],
      };
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft,
        mediaItems: [{ mediaType: 'image', url: 'initial-photo', sortOrder: 0 }],
      }));
      const originalMedia = structuredClone(memory.tables.media);
      const record = await handler(operations.getBySlug)({ db: memory.db }, { slug: 'object' }) as { revision: number; _id: string };
      memory.writes.length = 0;
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft,
        expectedRevision: record.revision, expectedDocumentId: record._id,
        translations: [{ language: 'de', title: 'Updated title', description: 'Updated story' }],
        mediaItems: mode === 'omitted' ? undefined : mode === 'empty' ? []
          : [{ mediaType: 'video', url: 'replacement-film', sortOrder: 0 }],
      }));
      expect(memory.tables[`${type}_translations`][0].title).toBe('Updated title');
      if (mode === 'omitted') {
        expect(memory.tables.media).toEqual(originalMedia);
        expect(memory.writes.some(write => (write as unknown[])[0] === 'delete')).toBe(false);
      } else if (mode === 'empty') {
        expect(memory.tables.media).toEqual([]);
      } else {
        expect(memory.tables.media).toHaveLength(1);
        expect(memory.tables.media[0]).toMatchObject({ parentType: type, mediaType: 'video', url: 'replacement-film' });
      }
    });
  });
}
