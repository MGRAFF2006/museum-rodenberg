import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
const sourceData = Object.fromEntries(['assets', 'exhibitions', 'artifacts'].map((name) => [
  `src/content/${name}.json`, readFileSync(new URL(`src/content/${name}.json`, root), 'utf8'),
]));

test('former server migration rejects with the existing seed command instead of reporting success', async () => {
  const source = readFileSync(new URL('convex/migrate.ts', root), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require: () => ({ internalAction: (definition) => definition.handler }) });
  await assert.rejects(exports.run(), /node scripts\/migrate-to-convex\.mjs; see docs\/content-seeding\.md/);
});

async function seed({ secret = 'fixture-write-token', failAt = -1, existing = false, failQuery = false } = {}) {
  const writes = [];
  const queries = [];
  const logs = [];
  const env = {
    '.env.local': 'CONVEX_SELF_HOSTED_URL=http://fixture.invalid:3210\nCONVEX_SELF_HOSTED_ADMIN_KEY=fixture-admin-token',
    '.env': secret ? `CONVEX_WRITE_SECRET=${secret}` : '',
    ...sourceData,
  };
  class Client {
    constructor(url) { assert.equal(url, 'http://fixture.invalid:3210'); }
    setAdminAuth(key) { assert.equal(key, 'fixture-admin-token'); }
    async query(operation, args) {
      assert.ok(['exhibitions.getBySlug', 'artifacts.getBySlug'].includes(operation));
      assert.deepEqual(Object.keys(args), ['slug']);
      queries.push({ operation, args });
      if (failQuery) throw new Error('Fixture query failed');
      return existing ? { _id: `${operation}:${args.slug}`, revision: operation === 'exhibitions.getBySlug' ? 7 : undefined } : null;
    }
    async mutation(operation, args) {
      if (writes.length === failAt) throw new Error(`Simulated remote error with ${args.serverSecret}`);
      writes.push({ operation, args });
    }
  }
  const api = { assets: { save: 'assets.save' }, exhibitions: { save: 'exhibitions.save', setFeatured: 'exhibitions.setFeatured', getBySlug: 'exhibitions.getBySlug' }, artifacts: { save: 'artifacts.save', getBySlug: 'artifacts.getBySlug' } };
  const fs = {
    existsSync: (file) => file.replace('/fixture/', '') in env,
    readFileSync: (file) => {
      const key = file.replace('/fixture/', '');
      assert.ok(key in env, `Unexpected file read ${key}`);
      return env[key];
    },
  };
  // Run the real CLI body with only module imports and its filesystem root replaced.
  const source = readFileSync(new URL('scripts/migrate-to-convex.mjs', root), 'utf8')
    .replace(/^#!.*\n/, '')
    .replace(/^import .*;\n/gm, '')
    .replace('const __dirname = path.dirname(fileURLToPath(import.meta.url));', 'const __dirname = "/fixture/scripts";');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('ConvexHttpClient', 'api', 'fs', 'path', 'process', 'console', source);
  let error;
  try {
    await run(Client, api, fs, path, { env: {}, exit: (status) => { throw new Error(`exit ${status}`); } }, {
      log: (...values) => logs.push(values.join(' ')),
      error: (...values) => logs.push(values.join(' ')),
    });
  } catch (caught) { error = caught; }
  return { writes, queries, logs, error };
}

test('working CLI seeds the shipped JSON through authenticated writes before reporting completion', async () => {
  const result = await seed();
  assert.equal(result.error, undefined);
  const assets = JSON.parse(sourceData['src/content/assets.json']).assets;
  const exhibitions = JSON.parse(sourceData['src/content/exhibitions.json']);
  const artifacts = JSON.parse(sourceData['src/content/artifacts.json']).artifacts;
  assert.equal(result.writes.length, Object.keys(assets).length + Object.keys(exhibitions.exhibitions).length + Object.keys(artifacts).length + 1);
  assert.ok(result.writes.every((write) => write.args.serverSecret === 'fixture-write-token'));
  assert.equal(result.queries.length, Object.keys(exhibitions.exhibitions).length + Object.keys(artifacts).length);
  for (const write of result.writes.filter(write => ['exhibitions.save', 'artifacts.save'].includes(write.operation))) {
    assert.equal(write.args.expectedRevision, undefined);
    assert.equal(write.args.expectedDocumentId, undefined);
  }
  assert.deepEqual(result.writes.at(-1), { operation: 'exhibitions.setFeatured', args: {
    slug: exhibitions.featured, serverSecret: 'fixture-write-token',
  } });
  assert.equal(result.logs.at(-1), '\n=== Migration complete! ===');
  assert.ok(result.logs.every((line) => !line.includes('fixture-write-token') && !line.includes('fixture-admin-token')));
});

test('missing write secret fails before any seed writes', async () => {
  const result = await seed({ secret: '' });
  assert.equal(result.error.message, 'exit 1');
  assert.equal(result.writes.length, 0);
  assert.ok(result.logs.some((line) => line.includes('CONVEX_WRITE_SECRET must match')));
  assert.ok(result.logs.every((line) => !line.includes('Migration complete')));
});

test('a failed seed write stops the import, hides credential-bearing errors, and never reports completion', async () => {
  const result = await seed({ failAt: 1 });
  assert.equal(result.writes.length, 1);
  assert.match(result.error.message, /Migration content write failed/);
  assert.ok(!result.error.message.includes('fixture-write-token'));
  assert.ok(result.logs.every((line) => !line.includes('Migration complete') && !line.includes('fixture-write-token')));
});


test('existing seed targets carry queried document identity and revision, including legacy revision zero', async () => {
  const result = await seed({ existing: true });
  assert.equal(result.error, undefined);
  for (const write of result.writes.filter(write => ['exhibitions.save', 'artifacts.save'].includes(write.operation))) {
    const queryOperation = write.operation.replace('.save', '.getBySlug');
    assert.ok(result.queries.some(query => query.operation === queryOperation && query.args.slug === write.args.slug));
    assert.equal(write.args.expectedDocumentId, `${queryOperation}:${write.args.slug}`);
    assert.equal(write.args.expectedRevision, write.operation === 'exhibitions.save' ? 7 : 0);
  }
});

test('failed target reads stop before any versioned content write or completion claim', async () => {
  const result = await seed({ failQuery: true });
  assert.match(result.error.message, /Fixture query failed/);
  assert.equal(result.queries.length, 1);
  assert.ok(result.writes.every(write => write.operation === 'assets.save'));
  assert.ok(result.logs.every(line => !line.includes('Migration complete')));
});
