// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Value } from 'convex/values';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';
import { handler, memoryDatabase, wireArgs } from './helpers/convexMemory';

beforeEach(() => vi.stubEnv('CONVEX_WRITE_SECRET', 'fixture-content-secret'));
afterEach(() => vi.unstubAllEnvs());

describe.each(['artifact', 'exhibition'] as const)('%s intentional translation removal', kind => {
  function fixture() {
    const parentField = `${kind}Id`;
    const translationTable = `${kind}_translations`;
    const memory = memoryDatabase({
      [`${kind}s`]: [{ _id: 'item', slug: 'item', image: '', qrCode: 'ITEM', ...(kind === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}) }],
      [translationTable]: ['de', 'fr', 'en'].map(language => ({
        _id: language, [parentField]: 'item', language, title: language, description: language,
        detailedContent: `Stored ${language} details`, ...(kind === 'artifact' ? { artist: 'Stored artist' } : { subtitle: 'Stored subtitle' }),
      })),
      media: [], settings: [],
    });
    const save = (changes: Record<string, Value | undefined>) => handler(kind === 'artifact' ? artifacts.save : exhibitions.save)({ db: memory.db }, wireArgs({
      serverSecret: 'fixture-content-secret', slug: 'item', image: '', qrCode: 'ITEM',
      ...(kind === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}),
      translations: [{ language: 'de', title: 'Titel', description: 'Updated' }], ...changes,
    }));
    return { ...memory, save, rows: memory.tables[translationTable] };
  }

  it('removes only explicitly cleared languages and preserves unseen rows and detail text', async () => {
    const { save, rows, tables } = fixture();
    await save({ removeLanguages: ['fr'] });
    expect(rows.map(row => row.language)).toEqual(['de', 'en']);
    expect(rows[0]).toMatchObject({ title: 'Titel', detailedContent: 'Stored de details' });
    expect(rows[1]).toMatchObject({ title: 'en', detailedContent: 'Stored en details' });
    expect(JSON.stringify(tables)).not.toContain('removeLanguages');
  });

  it('preserves all unseen data when no removals are requested and clears a known detail explicitly', async () => {
    const { save, rows } = fixture();
    await save({ removeLanguages: [], translations: [{ language: 'de', title: 'Titel', description: 'Updated', detailedContent: '' }] });
    expect(rows.map(row => row.language)).toEqual(['de', 'fr', 'en']);
    expect(rows[0].detailedContent).toBe('');
    expect(rows[1].detailedContent).toBe('Stored fr details');
  });

  it('preserves the complete-replacement contract for callers explicitly requesting it', async () => {
    const { save, rows } = fixture();
    await save({ replaceTranslations: true });
    expect(rows.map(row => row.language)).toEqual(['de']);
  });

  it('keeps a language included in the same save even if it is also named for removal', async () => {
    const { save, rows } = fixture();
    await save({ removeLanguages: ['de', 'missing'] });
    expect(rows.map(row => row.language)).toEqual(['de', 'fr', 'en']);
    expect(rows[0].title).toBe('Titel');
  });
});
