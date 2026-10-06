import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import dotenv from 'dotenv';
import { createBackup } from './backup-convex.mjs';

let root;
const env = { CONVEX_SELF_HOSTED_URL: 'http://localhost:3210', CONVEX_SELF_HOSTED_ADMIN_KEY: 'synthetic-key' };
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-backup-test-'));
  fs.mkdirSync(path.join(root, 'public/uploads'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public/uploads/audio.mp3'), Buffer.from([0, 1, 2, 255]));
});
afterEach(() => {
  mock.restoreAll();
  fs.rmSync(root, { recursive: true, force: true });
});
const exportSnapshot = (_command, args) => {
  fs.writeFileSync(args[args.indexOf('--path') + 1], 'synthetic snapshot');
  return { status: 0 };
};

test('complete backup preserves uploaded bytes and records its native snapshot', () => {
  const exporter = mock.method(childProcess, 'spawnSync', exportSnapshot);
  const directory = createBackup(['--writes-paused'], root, env);
  assert.deepEqual(fs.readFileSync(path.join(directory, 'uploads/audio.mp3')), Buffer.from([0, 1, 2, 255]));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'))).uploads, 'uploads');
  const args = exporter.mock.calls[0].arguments[1];
  assert.equal(args[0], 'export');
  assert.ok(args.includes('--include-file-storage'));
  assert.ok(!fs.existsSync(args[args.indexOf('--env-file') + 1]));
});

test('failed export never produces a completion marker and removes temporary credentials', () => {
  let envFile;
  mock.method(childProcess, 'spawnSync', (_command, args) => {
    envFile = args[args.indexOf('--env-file') + 1];
    return { status: 1 };
  });
  assert.throws(() => createBackup(['--writes-paused'], root, env), /export failed/);
  const directory = fs.readdirSync(path.join(root, 'backups'))[0];
  assert.ok(!fs.existsSync(path.join(root, 'backups', directory, 'manifest.json')));
  assert.ok(!fs.existsSync(envFile));
});

test('missing snapshot after apparent command success still fails', () => {
  mock.method(childProcess, 'spawnSync', () => ({ status: 0 }));
  assert.throws(() => createBackup(['--writes-paused'], root, env));
});

test('requires paused writes and an explicit production upload source', () => {
  assert.throws(() => createBackup([], root, env), /Pause all/);
  assert.throws(() => createBackup(['--prod', '--writes-paused'], root, {
    CONVEX_PROD_URL: 'http://localhost:3213', CONVEX_PROD_ADMIN_KEY: 'synthetic-prod',
  }), /matching live uploads/);
});

test('database-only mode does not claim upload protection', () => {
  mock.method(childProcess, 'spawnSync', exportSnapshot);
  const directory = createBackup(['--database-only'], root, env);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json')));
  assert.equal(manifest.uploads, null);
  assert.equal(manifest.writesPaused, false);
  assert.ok(!fs.existsSync(path.join(directory, 'uploads')));
});

test('process environment overrides local file, which overrides base file', () => {
  fs.writeFileSync(path.join(root, '.env'), 'CONVEX_SELF_HOSTED_URL=http://base:3210\nCONVEX_SELF_HOSTED_ADMIN_KEY=base-key\n');
  fs.writeFileSync(path.join(root, '.env.local'), 'CONVEX_SELF_HOSTED_URL=http://local:3210\n');
  mock.method(childProcess, 'spawnSync', (command, args) => {
    const target = dotenv.parse(fs.readFileSync(args[args.indexOf('--env-file') + 1]));
    assert.equal(target.CONVEX_SELF_HOSTED_URL, 'http://override:3210');
    assert.equal(target.CONVEX_SELF_HOSTED_ADMIN_KEY, 'base-key');
    assert.equal(fs.statSync(args[args.indexOf('--env-file') + 1]).mode & 0o777, 0o600);
    return exportSnapshot(command, args);
  });
  createBackup(['--database-only'], root, { CONVEX_SELF_HOSTED_URL: 'http://override:3210', CONVEX_DEPLOYMENT: 'unrelated' });
});

test('missing credentials and a destination inside uploads fail before export', () => {
  assert.throws(() => createBackup(['--database-only'], root, {}), /URL and admin key/);
  assert.throws(() => createBackup(['--writes-paused', '--output-dir', path.join(root, 'public/uploads/backups')], root, env), /outside the uploads/);
});

test('media copy failure leaves no completion marker', () => {
  mock.method(childProcess, 'spawnSync', exportSnapshot);
  fs.symlinkSync('/nonexistent-test-target', path.join(root, 'public/uploads/link'));
  assert.throws(() => createBackup(['--writes-paused'], root, env), /regular files/);
  const directory = fs.readdirSync(path.join(root, 'backups'))[0];
  assert.ok(!fs.existsSync(path.join(root, 'backups', directory, 'manifest.json')));
});
