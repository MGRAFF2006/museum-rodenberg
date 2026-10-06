import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const script = await readFile(new URL('../dev.sh', import.meta.url), 'utf8');
const service = `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import path from 'node:path';
const name = path.basename(process.argv[1]);
if (process.argv.includes('--once')) process.exit(Number(process.env.FIXTURE_ONCE_STATUS || 0));
const record = (event) => appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({ name, pid: process.pid, event }) + '\\n');
record('started');
process.on('SIGTERM', () => { record('stopped'); process.exit(0); });
setInterval(() => {}, 1000);
const code = process.env['FIXTURE_' + name.toUpperCase() + '_STATUS'];
if (code !== undefined) setTimeout(() => { record('exited'); process.exit(Number(code)); }, 50);
`;

async function fixture(t, env = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'museum-dev-supervision-'));
  await mkdir(path.join(directory, 'node_modules/.bin'), { recursive: true });
  await mkdir(path.join(directory, 'fake-bin'));
  await writeFile(path.join(directory, 'package.json'), '{"type":"module"}');
  await writeFile(path.join(directory, 'dev.sh'), script);
  await writeFile(path.join(directory, '.env.local'), 'CONVEX_SELF_HOSTED_ADMIN_KEY=fixture-admin-token');
  await writeFile(path.join(directory, 'fake-bin/curl'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  for (const name of ['convex', 'vite']) {
    await writeFile(path.join(directory, 'node_modules/.bin', name), service, { mode: 0o755 });
  }
  const log = path.join(directory, 'children.jsonl');
  let child;
  const records = async () => {
    try { return (await readFile(log, 'utf8')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  };
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    for (const { pid } of await records()) {
      try { process.kill(pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
    await rm(directory, { recursive: true, force: true });
  });
  function start() {
    child = spawn('bash', ['dev.sh', '--no-docker'], {
      cwd: directory,
      env: { ...process.env, ...env, FIXTURE_LOG: log, PATH: `${directory}/fake-bin:${process.env.PATH}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    const finished = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Supervisor did not stop: ${output}`)), 5000);
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', (code, signal) => { clearTimeout(timeout); resolve({ code, signal, output }); });
    });
    return { child, finished };
  }
  return { directory, records, start };
}

function assertStopped(records) {
  for (const { pid } of records.filter((record) => record.event === 'started')) {
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, `Service ${pid} survived supervisor cleanup`);
  }
}

for (const [name, code] of [['convex', 7], ['vite', 9], ['convex', 0], ['vite', 0]]) {
  test(`${name} exit ${code} stops its peer and fails the dev session`, async (t) => {
    const run = await fixture(t, { [`FIXTURE_${name.toUpperCase()}_STATUS`]: String(code) });
    const result = await run.start().finished;
    assert.equal(result.code, code || 1);
    assert.equal(result.signal, null);
    const records = await run.records();
    assert.equal(records.filter((record) => record.event === 'started').length, 2);
    assert.ok(records.some((record) => record.name !== name && record.event === 'stopped'));
    assertStopped(records);
    assert.equal(result.output.split('Shutting down...').length - 1, 1);
  });
}

for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  test(`${signal} returns ${code} and cleans up both services once`, async (t) => {
    const run = await fixture(t);
    const { child, finished } = run.start();
    for (let attempts = 0; ; attempts++) {
      if ((await run.records()).filter((record) => record.event === 'started').length === 2) break;
      assert.ok(attempts < 100, 'Services did not start');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    child.kill(signal);
    const result = await finished;
    assert.equal(result.code, code);
    assert.equal(result.output.split('Shutting down...').length - 1, 1);
    assert.equal((await run.records()).filter((record) => record.event === 'stopped').length, 2);
    assertStopped(await run.records());
  });
}

test('initial schema command failure is preserved and starts neither service', async (t) => {
  const run = await fixture(t, { FIXTURE_ONCE_STATUS: '12' });
  const result = await run.start().finished;
  assert.equal(result.code, 12);
  assert.deepEqual(await run.records(), []);
  assert.equal(result.output.split('Shutting down...').length - 1, 1);
});

test('watcher failure during startup still produces a failed supervisor session', async (t) => {
  const run = await fixture(t);
  await writeFile(path.join(run.directory, 'node_modules/.bin/convex'),
    '#!/bin/sh\ncase " $* " in *" --once "*) exit 0 ;; *) exit 7 ;; esac\n', { mode: 0o755 });
  const result = await run.start().finished;
  assert.equal(result.code, 7);
  assertStopped(await run.records());
});
