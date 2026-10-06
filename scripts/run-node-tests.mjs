import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function testsIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : testsIn(filename);
    return entry.isFile() && /\.test\.(?:mjs|cjs|js)$/.test(entry.name) ? [filename] : [];
  });
}

export function runNodeTests(root = ROOT, execute = spawnSync, log = console.log) {
  const files = ['scripts', 'server'].flatMap((directory) => testsIn(path.join(root, directory))).sort();
  if (files.length === 0) {
    log('No native Node test suites found under scripts/ or server/.');
    return 0;
  }
  const result = execute(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
  if (result.error) throw new Error('Could not start native Node tests');
  return result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runNodeTests(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
