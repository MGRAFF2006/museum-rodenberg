import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const script = await readFile(new URL('../dev.sh', import.meta.url), 'utf8');
const service = `#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
const name = path.basename(process.argv[1]);
if (process.argv.includes('--once')) process.exit(Number(process.env.FIXTURE_ONCE_STATUS || 0));
const record = (event) => appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({ name, pid: process.pid, event }) + '\\n');
process.on('SIGTERM', () => {
  if (process.env['FIXTURE_' + name.toUpperCase() + '_IGNORE_TERM']) { record('ignored'); return; }
  record('stopped'); process.exit(0);
});
record('started');
setInterval(() => {}, 1000);
// Strays from a failed test end themselves; teardown never signals saved PIDs.
setTimeout(() => process.exit(99), 20000).unref();
const code = process.env['FIXTURE_' + name.toUpperCase() + '_STATUS'];
const signal = process.env['FIXTURE_' + name.toUpperCase() + '_SIGNAL'];
// Wait for the peer's signal handler to be ready rather than racing a timer.
if (code !== undefined || signal) setInterval(() => {
  const records = readFileSync(process.env.FIXTURE_LOG, 'utf8').trim().split('\\n').map(JSON.parse);
  if (process.env.FIXTURE_RELEASE && !existsSync(process.env.FIXTURE_RELEASE)) return;
  if (records.some((record) => record.name !== name && record.event === 'started')) {
    record('exited');
    if (signal) process.kill(process.pid, signal);
    else process.exit(Number(code));
  }
}, 10);
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
    // Without job control, the services share the supervisor's process group.
    // Signal that group only while its leader is still running, so the group
    // ID cannot have been reused. Services left after the supervisor exits
    // fail assertStopped and end themselves after 20 seconds.
    if (child && child.exitCode === null && child.signalCode === null) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
    await rm(directory, { recursive: true, force: true });
  });
  function start({ trace = false } = {}) {
    child = spawn('bash', [...(trace ? ['-x'] : []), 'dev.sh', '--no-docker'], {
      cwd: directory,
      detached: true,
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

test('cleanup forcibly stops a peer that ignores SIGTERM and preserves the failure', async (t) => {
  const run = await fixture(t, { FIXTURE_CONVEX_STATUS: '7', FIXTURE_VITE_IGNORE_TERM: '1' });
  const result = await run.start().finished;
  assert.equal(result.code, 7);
  const records = await run.records();
  assert.ok(records.some((record) => record.name === 'vite' && record.event === 'ignored'));
  assertStopped(records);
  assert.equal(result.output.split('Shutting down...').length - 1, 1);
});

test('cleanup never signals a service PID that Bash has already reaped', async (t) => {
  const run = await fixture(t, { FIXTURE_CONVEX_STATUS: '7' });
  const result = await run.start({ trace: true }).finished;
  assert.equal(result.code, 7);
  const records = await run.records();
  const exited = records.find((record) => record.name === 'convex' && record.event === 'exited');
  assert.ok(exited, 'convex fixture did not exit on its own');
  // After `wait -n` reaps the exited watcher its PID may be reused. Cleanup
  // must signal Bash job specs, which Bash checks for liveness, never a PID.
  assert.doesNotMatch(result.output, new RegExp(`^\\++ kill .*\\b${exited.pid}\\b`, 'm'));
  assert.doesNotMatch(result.output, /^\++ kill (?:-\S+ )?\d+$/m);
  assert.match(result.output, /^\++ kill -TERM %\d+$/m);
  assert.ok(records.some((record) => record.name === 'vite' && record.event === 'stopped'));
  assertStopped(records);
});

test('a shutdown signal before a started service is recorded still stops it', async (t) => {
  const run = await fixture(t);
  // Deliver SIGTERM in the window between forking the watcher and saving its
  // PID: the exit trap runs before `PIDS+=($!)`.
  assert.ok(script.includes('PIDS+=($!)'));
  await writeFile(path.join(run.directory, 'dev.sh'), script.replace('PIDS+=($!)', () => 'kill -TERM $$\nPIDS+=($!)'));
  const result = await run.start().finished;
  assert.equal(result.code, 143, result.output);
  assert.equal(result.output.split('Shutting down...').length - 1, 1);
  assertStopped(await run.records());
});

test('cleanup stops services and keeps the status when output is a closed pipe', async (t) => {
  const run = await fixture(t);
  const { child, finished } = run.start();
  for (let attempts = 0; ; attempts++) {
    if ((await run.records()).filter((record) => record.event === 'started').length === 2) break;
    assert.ok(attempts < 100, 'Services did not start');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  child.stdout.destroy();
  child.kill('SIGTERM');
  const result = await finished;
  assert.equal(result.code, 143);
  const records = await run.records();
  assert.equal(records.filter((record) => record.event === 'stopped').length, 2);
  assertStopped(records);
});

test('a service killed by a signal before the supervisor waits still ends the session', async (t) => {
  const run = await fixture(t, { FIXTURE_CONVEX_SIGNAL: 'SIGKILL' });
  // Let the watcher die before the supervisor starts waiting for services.
  const banner = 'echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop all services"';
  assert.ok(script.includes(banner));
  await writeFile(path.join(run.directory, 'dev.sh'), script.replace(banner, () => `${banner}\nsleep 0.5`));
  const result = await run.start().finished;
  assert.equal(result.code, 137);
  const records = await run.records();
  assert.ok(records.some((record) => record.name === 'vite' && record.event === 'stopped'));
  assertStopped(records);
});

// Services exit only after the test creates `release` in the fixture directory.
async function startReleasable(t, env) {
  const run = await fixture(t, { ...env, FIXTURE_RELEASE: 'release' });
  const { child, finished } = run.start();
  for (let attempts = 0; ; attempts++) {
    if ((await run.records()).filter((record) => record.event === 'started').length === 2) break;
    assert.ok(attempts < 100, 'Services did not start');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return { run, child, finished, release: () => writeFile(path.join(run.directory, 'release'), '') };
}

for (const [env, code] of [[{ FIXTURE_CONVEX_STATUS: '7' }, 7], [{ FIXTURE_CONVEX_SIGNAL: 'SIGKILL' }, 137]]) {
  test(`a closed output pipe keeps service status ${code}`, async (t) => {
    const { run, child, finished, release } = await startReleasable(t, env);
    child.stdout.destroy();
    await release();
    const result = await finished;
    assert.equal(result.code, code);
    assertStopped(await run.records());
  });
}

test('services ending in the same poll report the failure, not the later success', async (t) => {
  const { run, finished, release } = await startReleasable(t, { FIXTURE_VITE_STATUS: '9', FIXTURE_CONVEX_STATUS: '0' });
  await release();
  const result = await finished;
  assert.equal(result.code, 9);
  assertStopped(await run.records());
});
