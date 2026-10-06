#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import childProcess from 'node:child_process';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createBackup(args = process.argv.slice(2), root = ROOT, environment = process.env) {
  const { values } = parseArgs({ args, options: {
    prod: { type: 'boolean' },
    production: { type: 'boolean' },
    'database-only': { type: 'boolean' },
    'writes-paused': { type: 'boolean' },
    'uploads-dir': { type: 'string' },
    'output-dir': { type: 'string' },
  } });
  const readEnv = name => {
    const file = path.join(root, name);
    return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
  };
  const env = { ...readEnv('.env'), ...readEnv('.env.local'), ...environment };
  const prod = values.prod || values.production;
  const url = env[prod ? 'CONVEX_PROD_URL' : 'CONVEX_SELF_HOSTED_URL'];
  const key = env[prod ? 'CONVEX_PROD_ADMIN_KEY' : 'CONVEX_SELF_HOSTED_ADMIN_KEY'];
  if (!url || !key || /[\r\n']/.test(url + key)) {
    throw new Error('Set the target Convex URL and admin key before backing up.');
  }
  if (!values['database-only'] && !values['writes-paused']) {
    throw new Error('Pause all curator/import writes, then pass --writes-paused; or select --database-only.');
  }
  if (prod && !values['database-only'] && !values['uploads-dir']) {
    throw new Error('Production backups require --uploads-dir pointing to the matching live uploads.');
  }
  const uploads = path.resolve(values['uploads-dir'] || path.join(root, 'public/uploads'));
  if (!values['database-only'] && !fs.statSync(uploads).isDirectory()) {
    throw new Error('The uploads source must be a directory.');
  }
  const output = path.resolve(values['output-dir'] || path.join(root, 'backups'));
  if (!values['database-only'] && (output === uploads || output.startsWith(uploads + path.sep))) {
    throw new Error('The backup destination must be outside the uploads source.');
  }
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  const directory = fs.mkdtempSync(path.join(output, new Date().toISOString().replace(/[:.]/g, '-') + '-'));
  const credentials = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-backup-'));
  try {
    const envFile = path.join(credentials, 'target.env');
    fs.writeFileSync(envFile, `CONVEX_SELF_HOSTED_URL='${url}'\nCONVEX_SELF_HOSTED_ADMIN_KEY='${key}'\n`, { mode: 0o600 });
    const snapshot = path.join(directory, 'convex.zip');
    const result = childProcess.spawnSync(path.join(root, 'node_modules/.bin/convex'), [
      'export', '--env-file', envFile, '--path', snapshot, '--include-file-storage',
    ], { cwd: root, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error('Convex export failed; backup is incomplete.');
    if (!fs.statSync(snapshot).isFile() || fs.statSync(snapshot).size === 0) {
      throw new Error('Convex export did not produce a snapshot.');
    }
    if (!values['database-only']) {
      fs.cpSync(uploads, path.join(directory, 'uploads'), {
        recursive: true,
        filter: source => {
          const stat = fs.lstatSync(source);
          if (!stat.isDirectory() && !stat.isFile()) throw new Error('Uploads must contain only regular files and directories.');
          return true;
        },
      });
    }
    // Written last: a directory without this marker is never a completed backup.
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({
      format: 1,
      createdAt: new Date().toISOString(),
      database: 'convex.zip',
      uploads: values['database-only'] ? null : 'uploads',
      writesPaused: !values['database-only'],
    }, null, 2) + '\n', { mode: 0o600 });
    return directory;
  } finally {
    fs.rmSync(credentials, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(`Backup saved: ${createBackup()}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
