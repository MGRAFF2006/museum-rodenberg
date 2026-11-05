#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Read-only audit of exact, nonblank QR identities across both content tables. */
export function auditContent(collections) {
  const owners = new Map();
  let checked = 0;
  for (const table of ['exhibitions', 'artifacts']) {
    if (!Array.isArray(collections[table])) throw new Error('Both content collections are required');
    for (const item of collections[table]) {
      if (!item || typeof item.slug !== 'string' || typeof item.qrCode !== 'string') {
        throw new Error('Content rows must have string slug and qrCode fields');
      }
      checked++;
      if (!item.qrCode.trim()) continue;
      const matches = owners.get(item.qrCode) ?? [];
      matches.push({ table, slug: item.slug });
      owners.set(item.qrCode, matches);
    }
  }
  return { checked, qrConflicts: [...owners.entries()]
    .filter(([, items]) => items.length > 1).map(([qrCode, items]) => ({ qrCode, items })) };
}

export function readContent(args) {
  if (args.length === 1 && args[0] === '--seeds') {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    return Object.fromEntries(['exhibitions', 'artifacts'].map(table => {
      const source = JSON.parse(fs.readFileSync(path.join(root, 'src/content', `${table}.json`), 'utf8'))[table];
      return [table, Object.entries(source).map(([slug, item]) => ({ ...item, slug }))];
    }));
  }
  if (args.length === 2 && args[0] === '--export-dir') {
    return Object.fromEntries(['exhibitions', 'artifacts'].map(table => {
      const source = fs.readFileSync(path.join(args[1], table, 'documents.jsonl'), 'utf8');
      return [table, source.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))];
    }));
  }
  throw new Error('Usage: node scripts/preflight-content.mjs --seeds | --export-dir <extracted Convex export>');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = auditContent(readContent(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.qrConflicts.length ? 1 : 0;
  } catch {
    // Exports can contain arbitrary data; do not echo parse errors or document values.
    console.error('Unable to verify content. Use --seeds or --export-dir with valid exhibitions/artifacts documents.jsonl files.');
    process.exitCode = 2;
  }
}
