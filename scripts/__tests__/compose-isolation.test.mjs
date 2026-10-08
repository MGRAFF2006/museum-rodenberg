import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hasCompose = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' }).status === 0;

function configFlags(run = spawnSync) {
  const help = run('docker', ['compose', 'config', '--help'], { encoding: 'utf8' });
  return help.status === 0 && help.stdout.includes('--no-env-resolution') ? ['--no-env-resolution'] : [];
}

const flags = hasCompose ? configFlags() : [];

for (const supported of [true, false]) {
  test(`configuration supports Compose ${supported ? 'with' : 'without'} --no-env-resolution`, () => {
    assert.deepEqual(configFlags(() => ({ status: 0, stdout: supported ? '--no-env-resolution' : '--format' })),
      supported ? ['--no-env-resolution'] : []);
  });
}

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'museum-compose-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.copyFile(path.join(root, 'docker-compose.yml'), path.join(dir, 'docker-compose.yml'));
  // Compose may validate env_file paths even when it skips resolving their values.
  await fs.writeFile(path.join(dir, '.env.local'), 'CONVEX_SELF_HOSTED_ADMIN_KEY=fixture-only-key\n');
  return dir;
}

function config(dir, password = 'fixture-password') {
  const env = { ...process.env };
  if (password === undefined) delete env.ADMIN_PASSWORD;
  else env.ADMIN_PASSWORD = password;
  return spawnSync('docker', ['compose', '--project-directory', dir, '--profile', 'dev', '--profile', 'dashboard', 'config', ...flags, '--format', 'json'], {
    cwd: dir, env, encoding: 'utf8',
  });
}

test('support services are loopback-only while the app uses the origin-relative proxy', { skip: !hasCompose }, async (t) => {
  const dir = await fixture(t);
  const result = config(dir);
  assert.equal(result.status, 0, result.stderr);
  const { services } = JSON.parse(result.stdout);
  for (const name of ['convex-backend', 'convex-dashboard', 'libretranslate']) {
    for (const port of services[name].ports) assert.equal(port.host_ip, '127.0.0.1');
  }
  assert.equal(services.museum.build.args.VITE_CONVEX_URL, '/convex');
  assert.equal(services.museum.environment.ADMIN_PASSWORD, 'fixture-password');
  const setup = services['convex-setup'];
  assert.ok(setup.volumes.some((mount) => mount.target === '/source' && mount.read_only === true));
  assert.ok(setup.volumes.some((mount) => mount.target === '/app/node_modules' && mount.type === 'volume'));
  assert.ok(!setup.volumes.some((mount) => mount.type === 'bind' && !mount.read_only));
  assert.ok(setup.tmpfs.includes('/app'));
  assert.equal(setup.environment.CONVEX_DEPLOYMENT, '');
  assert.equal(setup.environment.CONVEX_DEPLOY_KEY, '');
});

test('missing or empty admin password rejects configuration', { skip: !hasCompose }, async (t) => {
  const dir = await fixture(t);
  for (const password of [null, '']) {
    const env = { ...process.env };
    if (password === null) delete env.ADMIN_PASSWORD;
    else env.ADMIN_PASSWORD = password;
    const result = spawnSync('docker', ['compose', '--project-directory', dir, 'config', ...flags, '--quiet'], { cwd: dir, env, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Set ADMIN_PASSWORD/);
  }
});

for (const npmFails of [false, true]) {
  test(`setup ${npmFails ? 'stops after install failure' : 'deploys only the copied workspace'} without changing host files`, { skip: !hasCompose }, async (t) => {
    const dir = await fixture(t);
    const result = config(dir);
    assert.equal(result.status, 0, result.stderr);
    const entrypoint = JSON.parse(result.stdout).services['convex-setup'].entrypoint;
    assert.deepEqual(entrypoint.slice(0, 2), ['sh', '-ec']);
    const source = path.join(dir, 'source');
    const app = path.join(dir, 'app');
    const bin = path.join(dir, 'bin');
    await fs.mkdir(path.join(source, 'convex/_generated'), { recursive: true });
    await fs.mkdir(path.join(source, 'node_modules'), { recursive: true });
    await fs.mkdir(app);
    await fs.mkdir(bin);
    const originals = {
      'package.json': '{"name":"fixture"}', 'package-lock.json': '{"lockfileVersion":3}',
      '.env.local': 'VITE_CONVEX_URL=http://host-only:6543\n',
      'convex/_generated/api.js': 'host-generated-code', 'node_modules/host-marker': 'host-dependencies',
    };
    for (const [filename, content] of Object.entries(originals)) await fs.writeFile(path.join(source, filename), content);
    const trace = path.join(dir, 'trace');
    await fs.writeFile(path.join(bin, 'npm'), '#!/bin/sh\nprintf "npm:%s\\n" "$*" >> "$TEST_TRACE"\nexit "$TEST_NPM_STATUS"\n', { mode: 0o700 });
    await fs.writeFile(path.join(bin, 'npx'), '#!/bin/sh\nprintf "npx:%s\\n" "$*" >> "$TEST_TRACE"\nprintf "container-generated-code" > "$TEST_APP/convex/_generated/api.js"\n', { mode: 0o700 });
    const script = entrypoint[2].replaceAll('/source/', `${source}/`).replaceAll('/app/', `${app}/`);
    const executed = spawnSync('sh', ['-ec', script], { cwd: app,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEST_TRACE: trace, TEST_APP: app, TEST_NPM_STATUS: npmFails ? '7' : '0' }, encoding: 'utf8' });
    assert.equal(executed.status, npmFails ? 7 : 0, executed.stderr);
    const commands = await fs.readFile(trace, 'utf8');
    assert.match(commands, /npm:ci --prefer-offline --no-audit/);
    assert.equal(commands.includes('npx:'), !npmFails);
    if (!npmFails) assert.match(commands, /npx:--no-install convex deploy --typecheck=disable/);
    for (const [filename, original] of Object.entries(originals)) assert.equal(await fs.readFile(path.join(source, filename), 'utf8'), original);
    await assert.rejects(fs.stat(path.join(app, '.env.local')), /ENOENT/);
  });
}
