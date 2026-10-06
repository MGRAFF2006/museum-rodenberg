import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runNodeTests } from '../run-node-tests.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'museum-native-tests-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('empty trees skip with a useful message and no failing glob', async (t) => {
  const root = await fixture(t);
  const messages = [];
  assert.equal(runNodeTests(root, () => assert.fail('must not spawn'), (line) => messages.push(line)), 0);
  assert.match(messages[0], /No native Node test suites/);
});

test('discovers nested native suites while excluding dependency and visitor test trees', async (t) => {
  const root = await fixture(t);
  const included = ['scripts/__tests__/backup.test.mjs', 'scripts/nested/push.test.cjs', 'server/upload.test.js'];
  const excluded = ['scripts/node_modules/vendor.test.js', 'server/nested/node_modules/vendor.test.mjs', 'src/test/visitor.test.ts', 'scripts/backup-convex.mjs'];
  for (const name of [...included, ...excluded]) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), '');
  }
  let invoked = false;
  assert.equal(runNodeTests(root, (command, args, options) => {
    invoked = true;
    assert.equal(command, process.execPath);
    assert.deepEqual(args, ['--test', ...included.map((name) => path.join(root, name)).sort()]);
    assert.equal(options.cwd, root);
    assert.equal(options.stdio, 'inherit');
    return { status: 0 };
  }), 0);
  assert.equal(invoked, true);
});

test('native test failures and interrupted children fail the command', async (t) => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'server'));
  await fs.writeFile(path.join(root, 'server/failure.test.js'), '');
  assert.equal(runNodeTests(root, () => ({ status: 7 })), 7);
  assert.equal(runNodeTests(root, () => ({ status: null, signal: 'SIGINT' })), 1);
  assert.throws(() => runNodeTests(root, () => ({ error: new Error('fixture launch failure') })), /Could not start native/);
});

test('a real isolated failing Node suite propagates its status', async (t) => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'server'));
  await fs.writeFile(path.join(root, 'server/failure.test.cjs'), 'const test = require("node:test"); test("isolated deliberate failure", () => { throw new Error("fixture failure"); });');
  // Keep deliberate-failure TAP out of the outer successful test run.
  const { spawnSync } = await import('node:child_process');
  const env = { ...process.env };
  // The nested runner must not inherit the outer test worker's context.
  delete env.NODE_TEST_CONTEXT;
  assert.equal(runNodeTests(root, (command, args, options) => spawnSync(command, args, { ...options, env, stdio: 'pipe' })), 1);
});
