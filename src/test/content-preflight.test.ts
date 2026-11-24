// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditContent, readContent } from '../../scripts/preflight-content.mjs';

describe('read-only content preflight', () => {
  it('finds same-type and cross-type duplicates while leaving distinct and blank codes alone', () => {
    const data = { exhibitions: [
      { slug: 'a', qrCode: 'DUPLICATE' }, { slug: 'b', qrCode: 'DUPLICATE', revision: 2 },
      { slug: 'empty', qrCode: '' },
    ], artifacts: [
      { slug: 'c', qrCode: 'DUPLICATE' }, { slug: 'case-sensitive', qrCode: 'duplicate' },
      { slug: 'whitespace', qrCode: '  ' },
    ] };
    const before = JSON.stringify(data);
    expect(auditContent(data)).toEqual({ checked: 6, qrConflicts: [{ qrCode: 'DUPLICATE', items: [
      { table: 'exhibitions', slug: 'a' }, { table: 'exhibitions', slug: 'b' }, { table: 'artifacts', slug: 'c' },
    ] }] });
    expect(JSON.stringify(data)).toBe(before);
  });

  it('refuses incomplete input instead of claiming clean data', () => {
    expect(() => auditContent({ exhibitions: [] })).toThrow('collections');
    expect(() => auditContent({ exhibitions: [], artifacts: [{ slug: 'incomplete' }] })).toThrow('fields');
    expect(() => readContent(['--invalid'])).toThrow('Usage');
  });

  it('audits every committed seed without contacting a backend or reading environment files', () => {
    const output = execFileSync(process.execPath, ['scripts/preflight-content.mjs', '--seeds'], { cwd: process.cwd(), encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ checked: 18, qrConflicts: [] });
  });

  it('reads extracted Convex table JSONL, exits nonzero for conflicts and hides parse contents', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-preflight-'));
    try {
      for (const table of ['exhibitions', 'artifacts']) {
        fs.mkdirSync(path.join(root, table));
        fs.writeFileSync(path.join(root, table, 'documents.jsonl'), JSON.stringify({ slug: table, qrCode: 'DUPLICATE' }) + '\n');
      }
      const run = () => spawnSync(process.execPath, ['scripts/preflight-content.mjs', '--export-dir', root], { encoding: 'utf8' });
      const conflict = run();
      expect(conflict.status).toBe(1);
      expect(JSON.parse(conflict.stdout).qrConflicts[0].items).toHaveLength(2);
      fs.writeFileSync(path.join(root, 'artifacts/documents.jsonl'), '{"private":"fixture-do-not-echo" malformed');
      const invalid = run();
      expect(invalid.status).toBe(2);
      expect(invalid.stderr).toContain('Unable to verify content');
      expect(invalid.stdout + invalid.stderr).not.toContain('fixture-do-not-echo');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
