import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const validators = new Proxy({}, { get: () => () => ({}) });
function load(name, server = {}) {
  const exports = {};
  const source = readFileSync(new URL(`../../convex/${name}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    exports,
    require: (name) => name === 'convex/values' ? { v: validators } : {
      query: (definition) => definition.handler,
      mutation: (definition) => definition.handler,
      ...server,
    },
  });
  return exports;
}

const schema = load('schema', {
  defineSchema: (tables) => tables,
  defineTable: () => ({
    indexes: {},
    index(name, fields) { this.indexes[name] = fields; return this; },
  }),
}).default;
const artifacts = load('artifacts');
const exhibitions = load('exhibitions');
const lookup = load('lookup');
const languages = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl'];
const plain = (value) => JSON.parse(JSON.stringify(value));
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function database() {
  const tables = { artifacts: [], exhibitions: [], artifact_translations: [], exhibition_translations: [], media: [] };
  for (const kind of ['artifact', 'exhibition']) {
    for (let n = 0; n < 500; n++) {
      const id = `${kind}-${n}`;
      tables[`${kind}s`].push({ _id: id, _creationTime: n, slug: id, qrCode: id,
        exhibitionSlug: kind === 'artifact' ? `exhibition-${Math.floor(n / 10)}` : undefined });
      for (const [i, language] of languages.entries()) {
        tables[`${kind}_translations`].push({ _id: `${id}-${language}`, _creationTime: n * 7 + i,
          [`${kind}Id`]: id, language, title: n === 0 && language === 'en' ? 'Needle' : 'Object',
          description: 'Description', detailedContent: 'Large detail body',
          ...(kind === 'artifact' ? { significance: 'Significance' } : { subtitle: 'Subtitle' }) });
      }
      tables.media.push({ _id: `media-${id}`, _creationTime: n, parentType: kind, parentSlug: id,
        mediaType: 'image', url: `/uploads/${id}.jpg`, sortOrder: 0 });
    }
  }
  const reads = { rows: 0, calls: [] };
  const db = {
    query(table) {
      let fields = [];
      const constraints = [];
      let index;
      const query = {
        withIndex(name, range) {
          index = name;
          fields = schema[table].indexes[name];
          assert.ok(fields, `Undeclared index ${table}.${name}`);
          const builder = { eq(field, value) {
            assert.equal(field, fields[constraints.length], 'Index equality must follow its prefix');
            constraints.push([field, value]); return builder;
          } };
          range(builder);
          return query;
        },
        async collect() {
          const rows = tables[table].filter((row) => constraints.every(([field, value]) => row[field] === value));
          rows.sort((a, b) => {
            for (const field of [...fields, '_creationTime', '_id']) {
              const result = compare(a[field], b[field]);
              if (result) return result;
            }
            return 0;
          });
          reads.rows += rows.length;
          reads.calls.push({ table, index, rows: rows.length });
          return rows;
        },
        async first() { return (await query.collect())[0] ?? null; },
      };
      return query;
    },
    async get(id) {
      reads.rows++;
      return [...tables.artifacts, ...tables.exhibitions].find((row) => row._id === id) ?? null;
    },
  };
  return { db, reads, tables };
}

// Reference the former full-table join and language filter, independently of the new indexes.
async function previousList(ctx, kind, language, exhibitionSlug) {
  const records = exhibitionSlug === undefined
    ? await ctx.db.query(`${kind}s`).collect()
    : await ctx.db.query('artifacts').withIndex('by_exhibition', (q) => q.eq('exhibitionSlug', exhibitionSlug)).collect();
  if (!records.length) return [];
  const translations = await ctx.db.query(`${kind}_translations`).collect();
  const media = await ctx.db.query('media').withIndex('by_parent', (q) => q.eq('parentType', kind)).collect();
  return records.map((record) => ({ ...record,
    translations: translations.filter((row) => row[`${kind}Id`] === record._id &&
      (language === undefined || row.language === language || row.language === 'de'))
      .map((row) => {
        if (language === undefined) return row;
        const { detailedContent: _, ...rest } = row;
        return rest;
      }),
    media: media.filter((row) => row.parentSlug === record.slug),
  }));
}

for (const [kind, queries] of [['artifact', artifacts], ['exhibition', exhibitions]]) {
  for (const language of ['en', 'de', 'unknown']) {
    test(`${kind} listing preserves payload and fallback for ${language}, fetching only needed languages`, async () => {
      const current = database();
      const previous = database();
      const result = await queries.listForLanguage(current, { language });
      assert.deepEqual(plain(result), plain(await previousList(previous, kind, language)));
      assert.equal(previous.reads.rows, 4500);
      assert.equal(current.reads.rows, language === 'en' ? 2000 : 1500);
      assert.equal(current.reads.calls.filter((call) => call.table === `${kind}_translations`).length, language === 'de' ? 1 : 2);
      assert.ok(result.every((row) => row.translations.every((translation) => !('detailedContent' in translation))));
    });
  }
  test(`${kind} admin list still returns all translations and detail content`, async () => {
    const current = database();
    const result = await queries.list(current, {});
    assert.deepEqual(plain(result), plain(await previousList(database(), kind)));
    assert.equal(result[0].translations.length, 7);
    assert.equal(result[0].translations[0].detailedContent, 'Large detail body');
    assert.equal(current.reads.rows, 4500);
  });
}

test('exhibition artifacts fetch only their own translations and media with unchanged payloads', async () => {
  const current = database();
  const previous = database();
  const result = await artifacts.getByExhibition(current, { exhibitionSlug: 'exhibition-0' });
  assert.deepEqual(plain(result), plain(await previousList(previous, 'artifact', undefined, 'exhibition-0')));
  assert.equal(result.length, 10);
  assert.equal(previous.reads.rows, 4010);
  assert.equal(current.reads.rows, 90);
  assert.equal(current.reads.calls.length, 21); // More targeted reads, fewer fetched documents.
});

test('empty exhibition does not fetch translations or media', async () => {
  const current = database();
  assert.deepEqual(plain(await artifacts.getByExhibition(current, { exhibitionSlug: 'missing' })), []);
  assert.equal(current.reads.calls.length, 1);
  assert.equal(current.reads.rows, 0);
});

test('search fetches only its requested language and preserves matching entities', async () => {
  const current = database();
  const result = await lookup.search(current, { query: 'needle', language: 'en' });
  assert.deepEqual(plain(result), { exhibitions: [plain(current.tables.exhibitions[0])], artifacts: [plain(current.tables.artifacts[0])] });
  assert.equal(current.reads.rows, 1002); // Former scans fetched 7000 translations plus these two entities.
  assert.ok(current.reads.calls.every((call) => call.index === 'by_language'));
  const absent = database();
  assert.deepEqual(plain(await lookup.search(absent, { query: 'needle', language: 'unknown' })), { exhibitions: [], artifacts: [] });
  assert.equal(absent.reads.rows, 0); // Search never had German fallback.
});

test('empty search does not access the database', async () => {
  const current = database();
  assert.deepEqual(plain(await lookup.search(current, { query: '  ', language: 'en' })), { exhibitions: [], artifacts: [] });
  assert.equal(current.reads.calls.length, 0);
});

test('language index merge preserves creation order, including timestamp ties', async () => {
  const current = database();
  const previous = database();
  for (const fixture of [current, previous]) {
    fixture.tables.artifact_translations[0]._creationTime = 1;
  }
  assert.deepEqual(plain(await artifacts.listForLanguage(current, { language: 'en' })),
    plain(await previousList(previous, 'artifact', 'en')));
});
