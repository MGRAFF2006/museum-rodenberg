// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as artifacts from '../../convex/artifacts';
import * as exhibitions from '../../convex/exhibitions';

const credential = 'fixture-content-secret';
type Kind = 'artifact' | 'exhibition';
const handler = (kind: Kind) => ((kind === 'artifact' ? artifacts.save : exhibitions.save) as unknown as
  { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;

function fixture(kind: Kind) {
  const table = `${kind}s`;
  const translationTable = `${kind}_translations`;
  const parentId = `${kind}Id`;
  const rows: Record<string, Record<string, unknown>[]> = {
    [table]: [{ _id: 'item-id', slug: 'item', qrCode: 'ITEM', image: '',
      ...(kind === 'artifact' ? { dimensions: '10 cm', provenance: 'Old owner', exhibitionSlug: 'parent' } :
        { dateRange: '1900', location: 'Old room', curator: 'Old curator', organizer: 'Old organizer', sponsor: 'Old sponsor', artifactSlugs: [], isFeatured: false }) }],
    [translationTable]: [
      { _id: 'de-row', [parentId]: 'item-id', language: 'de', title: 'Titel', description: 'Beschreibung', detailedContent: 'Old details',
        ...(kind === 'artifact' ? { period: '1900', artist: 'Old artist', significance: 'Old significance' } : { subtitle: 'Old subtitle' }) },
      { _id: 'fr-row', [parentId]: 'item-id', language: 'fr', title: 'Titre', description: 'Texte' },
    ],
    media: [], settings: [],
  };
  let nextId = 0;
  const db = {
    query(name: string) {
      let matches = rows[name] ?? [];
      const chain = {
        withIndex(_name: string, filter: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) {
          const q = { eq(field: string, value: unknown) { matches = matches.filter(row => row[field] === value); return q; } };
          filter(q); return chain;
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
    async insert(name: string, fields: Record<string, unknown>) {
      const id = `${name}-${++nextId}`;
      (rows[name] ??= []).push({ ...fields, _id: id });
      return id;
    },
    async delete(id: string) {
      for (const name of Object.keys(rows)) rows[name] = rows[name].filter(row => row._id !== id);
    },
  };
  const args = { serverSecret: credential, slug: 'item', qrCode: 'ITEM', image: '',
    ...(kind === 'exhibition' ? { isFeatured: false, artifactSlugs: [] } : {}),
    translations: [{ language: 'de', title: 'Titel', description: 'Beschreibung' }], mediaItems: [] };
  const save = (changes: Record<string, unknown>) => handler(kind)({ db }, JSON.parse(JSON.stringify({ ...args, ...changes })));
  return { rows, table, translationTable, save };
}

beforeEach(() => vi.stubEnv('CONVEX_WRITE_SECRET', credential));
afterEach(() => vi.unstubAllEnvs());

describe.each(['artifact', 'exhibition'] as const)('%s editor save contract', kind => {
  it('persists explicit empty global and translated text after JSON serialization', async () => {
    const { rows, table, translationTable, save } = fixture(kind);
    const globalFields = kind === 'artifact' ? ['dimensions', 'provenance'] : ['dateRange', 'location', 'curator', 'organizer', 'sponsor'];
    const translatedFields = kind === 'artifact' ? ['period', 'artist', 'significance', 'detailedContent'] : ['subtitle', 'detailedContent'];
    await save({ ...Object.fromEntries(globalFields.map(field => [field, ''])),
      translations: [{ language: 'de', title: 'Titel', description: '', ...Object.fromEntries(translatedFields.map(field => [field, ''])) }] });
    for (const field of globalFields) expect(rows[table][0][field]).toBe('');
    const german = rows[translationTable].find(row => row.language === 'de')!;
    for (const field of translatedFields) expect(german[field]).toBe('');
  });

  it('preserves omitted optional fields and languages for partial/bulk saves', async () => {
    const { rows, table, translationTable, save } = fixture(kind);
    await save({ detailedContent: undefined });
    expect(rows[table][0][kind === 'artifact' ? 'dimensions' : 'dateRange']).toBe(kind === 'artifact' ? '10 cm' : '1900');
    expect(rows[translationTable].find(row => row.language === 'de')?.detailedContent).toBe('Old details');
    expect(rows[translationTable].find(row => row.language === 'fr')?.title).toBe('Titre');
  });

  it('replaces language rows only when the full editor explicitly requests replacement', async () => {
    const { rows, translationTable, save } = fixture(kind);
    await save({ replaceTranslations: true });
    expect(rows[translationTable].map(row => row.language)).toEqual(['de']);
    expect(rows[translationTable][0].title).toBe('Titel');
    expect(JSON.stringify(rows)).not.toContain('replaceTranslations');
  });

  it('rejects a duplicate creation without changing the existing content', async () => {
    const { rows, save } = fixture(kind);
    const before = JSON.stringify(rows);
    await expect(save({ createOnly: true, image: 'replacement' })).rejects.toThrow('already exists');
    expect(JSON.stringify(rows)).toBe(before);
  });

  it('creates once and permits ordinary updates without persisting operation flags', async () => {
    const { rows, table, save } = fixture(kind);
    await save({ slug: 'created', createOnly: true, replaceTranslations: true });
    await expect(save({ slug: 'created', createOnly: true })).rejects.toThrow('already exists');
    await save({ slug: 'created', image: 'edited' });
    expect(rows[table].find(row => row.slug === 'created')?.image).toBe('edited');
    expect(JSON.stringify(rows)).not.toContain('createOnly');
    expect(JSON.stringify(rows)).not.toContain('replaceTranslations');
  });
});

it('normalizes an explicitly empty artifact parent to a deleted optional field while omission preserves it', async () => {
  const { rows, save } = fixture('artifact');
  await save({ exhibitionSlug: undefined });
  expect(rows.artifacts[0].exhibitionSlug).toBe('parent');
  await save({ exhibitionSlug: '' });
  expect(rows.artifacts[0]).not.toHaveProperty('exhibitionSlug');
});
