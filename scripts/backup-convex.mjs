#!/usr/bin/env node
// Native Convex snapshot plus the museum's separate upload disk.
// Recovery instructions and consistency limits: docs/backups.md.
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

async function readEnv(root, filename) {
  try {
    return dotenv.parse(await fs.readFile(path.join(root, filename)));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Cannot read ${filename}`, { cause: error });
  }
}

export async function backupConfig(args, root = ROOT, environment = process.env) {
  const { values } = parseArgs({ args, options: {
    prod: { type: 'boolean' },
    production: { type: 'boolean' },
    'uploads-dir': { type: 'string' },
    'output-dir': { type: 'string' },
  } });
  const prod = values.prod || values.production || false;
  const env = { ...await readEnv(root, '.env'), ...await readEnv(root, '.env.local'), ...environment };
  const urlName = prod ? 'CONVEX_PROD_URL' : 'CONVEX_SELF_HOSTED_URL';
  const keyName = prod ? 'CONVEX_PROD_ADMIN_KEY' : 'CONVEX_SELF_HOSTED_ADMIN_KEY';
  const url = env[urlName];
  const key = env[keyName];
  if (!url || !key) throw new Error(`Set ${urlName} and ${keyName} before backing up`);
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error(`${urlName} must be an HTTP(S) URL`); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${urlName} must be an HTTP(S) URL without credentials, query, or fragment`);
  }
  if (prod && !values['uploads-dir']) {
    throw new Error('Production backup requires --uploads-dir pointing to the mounted production upload disk');
  }
  return {
    root, prod, url, key, env,
    uploadsDir: path.resolve(root, values['uploads-dir'] || 'public/uploads'),
    outputDir: path.resolve(root, values['output-dir'] || 'backups'),
  };
}

export function runCommand(command, args, options, label) {
  return new Promise((resolve, reject) => {
    // Do not forward CLI diagnostics: they can contain deployment credentials.
    const child = spawn(command, args, { ...options, stdio: 'ignore' });
    child.once('error', () => reject(new Error(`${label} could not start`)));
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed (${signal || `exit ${code}`}); backup was not completed`));
    });
  });
}

async function digest(filename) {
  const stat = await fs.stat(filename);
  if (!stat.isFile() || stat.size === 0) throw new Error('Backup archive is missing or empty');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return { bytes: stat.size, sha256: hash.digest('hex') };
}

export async function createBackup(config, run = runCommand, log = console.log) {
  const { root, prod, url, key, env, uploadsDir, outputDir } = config;
  const uploads = await fs.realpath(uploadsDir);
  if (!(await fs.stat(uploads)).isDirectory()) throw new Error('Upload source must be a directory');
  await fs.mkdir(outputDir, { recursive: true, mode: 0o700 });
  const output = await fs.realpath(outputDir);
  const relative = path.relative(uploads, output);
  if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new Error('Backup output must be outside the upload source');
  }
  const startedAt = new Date().toISOString();
  const staging = await fs.mkdtemp(path.join(output, '.incomplete-'));
  const backupDir = path.join(output, `${startedAt.replace(/[:.]/g, '-')}-${path.basename(staging).replace('.incomplete-', '')}`);
  try {
    const cli = path.join(path.dirname(require.resolve('convex/package.json')), 'bin/main.js');
    const database = path.join(staging, 'convex.zip');
    log('Exporting authenticated Convex snapshot...');
    await run(process.execPath, [cli, 'export', '--path', database, '--include-file-storage'], {
      cwd: root,
      env: { ...env, CONVEX_SELF_HOSTED_URL: url, CONVEX_SELF_HOSTED_ADMIN_KEY: key,
        CONVEX_DEPLOY_KEY: '', CONVEX_DEPLOYMENT: '', CONVEX_VERBOSE: '', CI: '1' },
    }, 'Convex snapshot export');
    const databaseDigest = await digest(database);
    log('Archiving uploads (filesystem archive; freeze writes for consistency)...');
    const media = path.join(staging, 'uploads.tar.gz');
    await run('tar', ['-czf', media, '-C', uploads, '.'], {
      cwd: root, env: { ...process.env, TAR_OPTIONS: '' },
    }, 'Upload archive');
    const mediaDigest = await digest(media);
    const manifest = {
      formatVersion: 1, source: prod ? 'production' : 'local', deploymentUrl: url,
      startedAt, completedAt: new Date().toISOString(),
      consistency: { database: 'Convex point-in-time snapshot', uploads: 'Filesystem archive; requires external write freeze' },
      files: { 'convex.zip': databaseDigest, 'uploads.tar.gz': mediaDigest },
    };
    await fs.writeFile(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(staging, backupDir);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  log(`Backup complete: ${backupDir}`);
  log('Restore using the native ZIP import and upload archive: docs/backups.md');
  return backupDir;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await createBackup(await backupConfig(process.argv.slice(2)));
  } catch (error) {
    console.error(`Backup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
