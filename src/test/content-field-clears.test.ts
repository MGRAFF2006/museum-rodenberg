// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';
import { handler, memoryDatabase, wireArgs } from './helpers/convexMemory';

afterEach(() => vi.unstubAllEnvs());

for (const [type, operations] of [['artifact', artifacts], ['exhibition', exhibitions]] as const) {
  describe(`${type} explicit field clears`, () => {
    const globalFields = type === 'exhibition'
      ? { dateRange: 'Dates', location: 'Location', curator: 'Curator', organizer: 'Organizer', sponsor: 'Sponsor', tags: ['history'], enabledAttributes: ['title'] }
      : { exhibitionSlug: 'parent', dimensions: 'Size', provenance: 'Origin', materials: ['wood'], tags: ['history'], enabledAttributes: ['title'] };
    const translatedFields = type === 'exhibition' ? { subtitle: 'Subtitle', detailedContent: 'Full story' }
      : { period: 'Period', artist: 'Artist', significance: 'Significance', detailedContent: 'Full story' };
    const draft = { serverSecret: 'fixture-credential', slug: 'object', qrCode: 'qr', image: '',
      ...(type === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}),
    };

    it.each(['omitted', 'cleared'] as const)('handles %s optional metadata without deleting unrelated translations', async mode => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft, ...globalFields,
        translations: [
          { language: 'de', title: 'Initial', description: 'Story', ...translatedFields },
          { language: 'en', title: 'English', description: 'English story', detailedContent: 'English details' },
        ],
      }));
      const record = await handler(operations.getBySlug)({ db: memory.db }, { slug: 'object' }) as { revision: number; _id: string };
      const globals = Object.fromEntries(Object.keys(globalFields).map(key => [key, mode === 'cleared' ? null : undefined]));
      const translated = Object.fromEntries(Object.keys(translatedFields).map(key => [key, mode === 'cleared' ? null : undefined]));
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft, ...globals,
        expectedRevision: record.revision, expectedDocumentId: record._id,
        translations: [{ language: 'de', title: 'Updated', description: 'Updated story', ...translated }],
      }));
      const current = memory.tables[`${type}s`][0];
      const de = memory.tables[`${type}_translations`].find(row => row.language === 'de')!;
      for (const [key, original] of Object.entries(globalFields)) {
        if (mode === 'cleared') expect(current).not.toHaveProperty(key);
        else expect(current[key]).toEqual(original);
      }
      for (const [key, original] of Object.entries(translatedFields)) {
        if (mode === 'cleared') expect(de).not.toHaveProperty(key);
        else expect(de[key]).toEqual(original);
      }
      expect(de.title).toBe('Updated');
      expect(memory.tables[`${type}_translations`].find(row => row.language === 'en')).toMatchObject({ title: 'English', detailedContent: 'English details' });
    });

    it('accepts cleared optional values during creation without persisting null', async () => {
      vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-credential');
      const memory = memoryDatabase();
      await handler(operations.save)({ db: memory.db }, wireArgs({ ...draft,
        ...Object.fromEntries(Object.keys(globalFields).map(key => [key, null])),
        translations: [{ language: 'de', title: 'Created', description: '',
          ...Object.fromEntries(Object.keys(translatedFields).map(key => [key, null])),
        }],
      }));
      for (const key of Object.keys(globalFields)) expect(memory.tables[`${type}s`][0]).not.toHaveProperty(key);
      for (const key of Object.keys(translatedFields)) expect(memory.tables[`${type}_translations`][0]).not.toHaveProperty(key);
    });
  });
}
