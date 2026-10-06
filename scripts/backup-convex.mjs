#!/usr/bin/env node
// Native Convex exports preserve document IDs, every table, and file storage.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local'), quiet: true });
dotenv.config({ path: path.join(root, '.env'), quiet: true });
const isProd = process.argv.includes('--prod') || process.argv.includes('--production');
const url = isProd ? process.env.CONVEX_PROD_URL : process.env.CONVEX_SELF_HOSTED_URL;
const key = isProd ? process.env.CONVEX_PROD_ADMIN_KEY : process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;
if (!url || !key) throw new Error('Set the target Convex URL and admin key before backing up');
const directory = path.join(root, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
const result = spawnSync(path.join(root, 'node_modules/.bin/convex'), [
  'export', '--path', path.join(directory, 'convex.zip'), '--include-file-storage',
], { stdio: 'inherit', cwd: root, env: {
  ...process.env, CONVEX_SELF_HOSTED_URL: url, CONVEX_SELF_HOSTED_ADMIN_KEY: key,
} });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log(`Database snapshot saved to ${directory}/convex.zip`);
console.log('Also copy the matching live uploads; database exports do not include files stored by Express.');
console.log('Use scripts/backup-production.sh for a consistent database + upload backup of the Compose stack.');
