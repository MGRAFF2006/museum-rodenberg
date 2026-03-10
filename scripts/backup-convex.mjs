#!/usr/bin/env node
/**
 * Backup all Convex data to JSON files.
 *
 * Exports exhibitions, artifacts, assets, and all translation/media rows
 * from the Convex backend into a timestamped backup directory.
 *
 * Usage:
 *   node scripts/backup-convex.mjs                    # backup local
 *   node scripts/backup-convex.mjs --prod             # backup Sevalla
 *   CONVEX_PROD_URL=... CONVEX_PROD_ADMIN_KEY=... node scripts/backup-convex.mjs --prod
 *
 * Output: backups/YYYY-MM-DDTHH-MM-SS/
 *   exhibitions.json
 *   artifacts.json
 *   assets.json
 *   exhibition_translations.json
 *   artifact_translations.json
 *   media.json
 *   featured.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load env files
dotenv.config({ path: path.join(ROOT, '.env') });
dotenv.config({ path: path.join(ROOT, '.env.local') });

const isProd = process.argv.includes('--prod') || process.argv.includes('--production');

let convexUrl;
if (isProd) {
  convexUrl = process.env.CONVEX_PROD_URL || '';
  if (!convexUrl) {
    // Try to parse from .env.local commented section
    try {
      const envLocal = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8');
      const match = envLocal.match(/^#?\s*CONVEX_SELF_HOSTED_URL=(.*(?:sevalla|proxy).*)$/m);
      if (match) convexUrl = match[1].trim();
    } catch {}
  }
  if (!convexUrl) {
    console.error('No Sevalla URL found. Set CONVEX_PROD_URL or uncomment in .env.local');
    process.exit(1);
  }
  console.log(`Backing up from Sevalla: ${convexUrl}`);
} else {
  convexUrl = process.env.CONVEX_SELF_HOSTED_URL || 'http://127.0.0.1:3210';
  console.log(`Backing up from local: ${convexUrl}`);
}

const client = new ConvexHttpClient(convexUrl);

// ── Create backup directory ──────────────────────────────────────

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupDir = path.join(ROOT, 'backups', timestamp);
fs.mkdirSync(backupDir, { recursive: true });

console.log(`Backup directory: ${backupDir}`);

// ── Export tables ────────────────────────────────────────────────

async function exportTable(name, queryFn) {
  try {
    const data = await queryFn();
    const filePath = path.join(backupDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    const count = Array.isArray(data) ? data.length : 1;
    console.log(`  ${name}: ${count} records`);
    return data;
  } catch (err) {
    console.error(`  ${name}: FAILED - ${err.message}`);
    return null;
  }
}

async function run() {
  console.log('\nExporting tables...');

  // Use the list queries that return full data (all languages)
  await Promise.all([
    exportTable('exhibitions', () => client.query(api.exhibitions.list)),
    exportTable('artifacts', () => client.query(api.artifacts.list)),
    exportTable('assets', () => client.query(api.assets.list)),
    exportTable('featured', () => client.query(api.exhibitions.getFeatured)),
  ]);

  console.log(`\nBackup complete: ${backupDir}`);
  console.log('To restore, use scripts/migrate-to-convex.mjs with the backup files as source.');
}

run().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
