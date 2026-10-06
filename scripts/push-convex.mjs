import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const HELP = `Usage: bash scripts/push-convex.sh [--prod] [--url URL] [--key KEY]

Local: CONVEX_SELF_HOSTED_URL / CONVEX_SELF_HOSTED_ADMIN_KEY
Production: CONVEX_PROD_URL / CONVEX_PROD_ADMIN_KEY
Precedence: flags > process environment > .env.local > .env.
Prefer an ignored env file or process environment for keys: --key exposes them
in shell history and this wrapper's process arguments. See docs/schema-push.md.`;

async function readEnv(root, filename) {
  try { return dotenv.parse(await fs.readFile(path.join(root, filename))); }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Cannot read ${filename}`);
  }
}

export async function pushConfig(args, root = ROOT, environment = process.env) {
  let values;
  try {
    ({ values } = parseArgs({ args, options: {
      prod: { type: 'boolean' }, production: { type: 'boolean' }, sevalla: { type: 'boolean' },
      url: { type: 'string' }, key: { type: 'string' }, help: { type: 'boolean', short: 'h' },
    } }));
  } catch { throw new Error('Invalid arguments; use --help for supported options and required values'); }
  if (values.help) return { help: true };
  const prod = values.prod || values.production || values.sevalla || false;
  const env = { ...await readEnv(root, '.env'), ...await readEnv(root, '.env.local'), ...environment };
  const urlName = prod ? 'CONVEX_PROD_URL' : 'CONVEX_SELF_HOSTED_URL';
  const keyName = prod ? 'CONVEX_PROD_ADMIN_KEY' : 'CONVEX_SELF_HOSTED_ADMIN_KEY';
  const url = values.url ?? env[urlName];
  const key = values.key ?? env[keyName];
  if (!url || !key) throw new Error(`Set ${urlName} and ${keyName}, or provide --url and --key`);
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error(`${urlName} must be an HTTP(S) URL`); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${urlName} must be an HTTP(S) URL without credentials, query, or fragment`);
  }
  return { root, prod, url, key, keyFromFlag: values.key !== undefined, env };
}

export async function pushSchema(config, { spawnProcess = spawn, signals = process, log = console.log } = {}) {
  if (config.help) { log(HELP); return; }
  if (config.keyFromFlag) log('Prefer environment credentials: --key can remain in shell history/process arguments.');
  const cli = path.join(path.dirname(require.resolve('convex/package.json')), 'bin/main.js');
  log(`Pushing schema to configured ${config.prod ? 'production' : 'local'} deployment...`);
  await new Promise((resolve, reject) => {
    // deploy accepts explicit self-hosted credentials without dev's env-file writes.
    // Suppress CLI output, which may contain credentials in diagnostics.
    const child = spawnProcess(process.execPath, [cli, 'deploy', '--typecheck=disable'], {
      cwd: config.root, stdio: 'ignore',
      env: { ...config.env, CONVEX_SELF_HOSTED_URL: config.url, CONVEX_SELF_HOSTED_ADMIN_KEY: config.key,
        CONVEX_DEPLOY_KEY: '', CONVEX_DEPLOYMENT: '', CONVEX_VERBOSE: '', CI: '1' },
    });
    let interrupted;
    const interrupt = (signal) => { interrupted = signal; child.kill(signal); };
    const onInt = () => interrupt('SIGINT');
    const onTerm = () => interrupt('SIGTERM');
    signals.on('SIGINT', onInt);
    signals.on('SIGTERM', onTerm);
    const cleanup = () => {
      signals.removeListener('SIGINT', onInt);
      signals.removeListener('SIGTERM', onTerm);
    };
    child.once('error', () => { cleanup(); reject(new Error('Convex deployment could not start')); });
    child.once('exit', (code, signal) => {
      cleanup();
      if (code === 0 && !interrupted) resolve();
      else {
        const error = new Error(`Schema push failed (${interrupted || signal || `exit ${code}`})`);
        error.exitCode = interrupted === 'SIGINT' ? 130 : interrupted === 'SIGTERM' ? 143 : 1;
        reject(error);
      }
    });
  });
  log('Schema pushed successfully; local environment files were not rewritten.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await pushSchema(await pushConfig(process.argv.slice(2))); }
  catch (error) { console.error(`Schema push failed: ${error.message}`); process.exitCode = error.exitCode || 1; }
}
