import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { backupConfig, createBackup, runCommand } from '../backup-convex.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'museum-backup-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const uploads = path.join(root, 'public/uploads');
  await fs.mkdir(uploads, { recursive: true });
  await fs.writeFile(path.join(uploads, 'photo with spaces.txt'), 'curator upload');
  const env = { CONVEX_SELF_HOSTED_URL: 'http://localhost:3210', CONVEX_SELF_HOSTED_ADMIN_KEY: 'test-secret' };
  return { root, uploads, config: await backupConfig([], root, env) };
}

async function fakeExport(command, args, options, label) {
  if (label === 'Convex snapshot export') {
    assert.equal(command, process.execPath);
    assert.ok(args.includes('--include-file-storage'));
    await fs.writeFile(args[args.indexOf('--path') + 1], 'fake isolated snapshot');
  } else {
    await runCommand(command, args, options, label);
  }
}

test('local env overrides .env, while process env has final precedence', async (t) => {
  const { root } = await fixture(t);
  await fs.writeFile(path.join(root, '.env'), 'CONVEX_SELF_HOSTED_URL=http://old:3210\nCONVEX_SELF_HOSTED_ADMIN_KEY=old-key');
  await fs.writeFile(path.join(root, '.env.local'), 'CONVEX_SELF_HOSTED_URL=http://active:3210\nCONVEX_SELF_HOSTED_ADMIN_KEY=active-key');
  assert.equal((await backupConfig([], root, {})).url, 'http://active:3210');
  assert.equal((await backupConfig([], root, {})).key, 'active-key');
  const explicit = await backupConfig([], root, { CONVEX_SELF_HOSTED_URL: 'http://override:3210' });
  assert.equal(explicit.url, 'http://override:3210');
  assert.equal(explicit.key, 'active-key');
});

test('production selects named credentials and requires an explicit mounted media source', async (t) => {
  const { root, uploads } = await fixture(t);
  await fs.writeFile(path.join(root, '.env.local'), 'CONVEX_PROD_URL=https://production.example\nCONVEX_PROD_ADMIN_KEY=prod-secret');
  await assert.rejects(backupConfig(['--prod'], root, {}), /requires --uploads-dir/);
  const config = await backupConfig(['--production', '--uploads-dir', uploads], root, {});
  assert.equal(config.url, 'https://production.example');
  assert.equal(config.key, 'prod-secret');
  assert.equal(config.uploadsDir, uploads);
});

test('commented historical credentials and missing keys do not select a backend', async (t) => {
  const { root } = await fixture(t);
  await fs.writeFile(path.join(root, '.env.local'), '# CONVEX_PROD_URL=https://historical.example\n# CONVEX_PROD_ADMIN_KEY=old-key');
  await assert.rejects(backupConfig(['--prod', '--uploads-dir', 'public/uploads'], root, {}), /Set CONVEX_PROD_URL/);
  await assert.rejects(backupConfig([], root, { CONVEX_SELF_HOSTED_URL: 'http://localhost:3210' }), /Set CONVEX_SELF_HOSTED_URL/);
});

test('URLs cannot carry credentials into the manifest or logs', async (t) => {
  const { root, config } = await fixture(t);
  for (const url of ['https://user:secret@example.test', 'https://example.test?key=secret', 'ftp://example.test']) {
    await assert.rejects(backupConfig([], root, { ...config.env, CONVEX_SELF_HOSTED_URL: url }), /without credentials/);
  }
});

test('completed backup pairs archives and matching checksums without leaking credentials', async (t) => {
  const { root, config } = await fixture(t);
  const logs = [];
  let exportOptions;
  const backupDir = await createBackup(config, async (command, args, options, label) => {
    if (label === 'Convex snapshot export') {
      exportOptions = options;
      assert.ok(!args.join(' ').includes(config.key));
    }
    await fakeExport(command, args, options, label);
  }, (line) => logs.push(line));
  const manifest = JSON.parse(await fs.readFile(path.join(backupDir, 'manifest.json')));
  for (const [filename, metadata] of Object.entries(manifest.files)) {
    const bytes = await fs.readFile(path.join(backupDir, filename));
    assert.equal(metadata.bytes, bytes.length);
    assert.equal(metadata.sha256, createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(exportOptions.env.CONVEX_SELF_HOSTED_ADMIN_KEY, config.key);
  assert.equal(exportOptions.env.CONVEX_DEPLOY_KEY, '');
  assert.equal(exportOptions.env.CONVEX_DEPLOYMENT, '');
  assert.ok(!JSON.stringify(manifest).includes(config.key));
  assert.ok(!logs.join('\n').includes(config.key));
  assert.equal(logs.filter((line) => line.startsWith('Backup complete:')).length, 1);
  assert.match(manifest.consistency.uploads, /external write freeze/);
  assert.equal((await fs.stat(backupDir)).mode & 0o777, 0o700);
  const restored = path.join(root, 'isolated-restored-uploads');
  await fs.mkdir(restored);
  await runCommand('tar', ['-xzf', path.join(backupDir, 'uploads.tar.gz'), '-C', restored], {}, 'Fixture extraction');
  assert.equal(await fs.readFile(path.join(restored, 'photo with spaces.txt'), 'utf8'), 'curator upload');
});

for (const failedPhase of ['Convex snapshot export', 'Upload archive']) {
  test(`${failedPhase} failure removes partial files and never reports success`, async (t) => {
    const { config } = await fixture(t);
    const logs = [];
    await assert.rejects(createBackup(config, async (command, args, options, label) => {
      if (label === failedPhase) {
        const destination = label === 'Convex snapshot export' ? args[args.indexOf('--path') + 1] : args[1];
        await fs.writeFile(destination, 'partial');
        throw new Error('simulated failure');
      }
      await fakeExport(command, args, options, label);
    }, (line) => logs.push(line)), /simulated failure/);
    assert.deepEqual(await fs.readdir(config.outputDir), []);
    assert.ok(!logs.some((line) => line.startsWith('Backup complete:')));
  });
}

test('zero-byte or absent export cannot be marked complete', async (t) => {
  const { config } = await fixture(t);
  await assert.rejects(createBackup(config, async (_command, args) => {
    await fs.writeFile(args[args.indexOf('--path') + 1], '');
  }, () => {}), /missing or empty/);
  assert.deepEqual(await fs.readdir(config.outputDir), []);
  await assert.rejects(createBackup(config, async () => {}, () => {}), /ENOENT/);
  assert.deepEqual(await fs.readdir(config.outputDir), []);
});

test('output cannot be recursively archived into itself, including through symlinks', async (t) => {
  const { root, config, uploads } = await fixture(t);
  const alias = path.join(root, 'upload-alias');
  await fs.symlink(uploads, alias);
  const invalid = { ...config, outputDir: path.join(alias, 'backups') };
  await assert.rejects(createBackup(invalid, () => assert.fail('must not spawn'), () => {}), /outside the upload source/);
});

test('missing media source fails before export', async (t) => {
  const { config } = await fixture(t);
  await assert.rejects(createBackup({ ...config, uploadsDir: path.join(config.root, 'absent') }, () => assert.fail('must not spawn'), () => {}), /ENOENT/);
});

test('child failure is nonzero and stderr containing a credential is not forwarded', async () => {
  await assert.rejects(runCommand(process.execPath, ['-e', 'console.error("private-test-credential"); process.exit(3)'], {}, 'Fixture command'), (error) => {
    assert.match(error.message, /exit 3/);
    assert.ok(!error.message.includes('private-test-credential'));
    return true;
  });
});
