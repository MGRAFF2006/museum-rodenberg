import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { EventEmitter } from 'node:events';
import { pushConfig, pushSchema } from '../push-convex.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'museum-schema-push-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const env = { CONVEX_SELF_HOSTED_URL: 'http://custom-local:9876', CONVEX_SELF_HOSTED_ADMIN_KEY: 'private-fixture-key',
    CONVEX_PROD_URL: 'https://custom-production.example', CONVEX_PROD_ADMIN_KEY: 'private-prod-key' };
  return { root, env };
}

test('both flag forms work and flags override named production credentials', async (t) => {
  const { root, env } = await fixture(t);
  for (const args of [
    ['--prod', '--url', 'https://explicit.example', '--key', 'flag-key'],
    ['--production', '--url=https://explicit.example', '--key=flag-key'],
  ]) {
    const config = await pushConfig(args, root, env);
    assert.equal(config.url, 'https://explicit.example');
    assert.equal(config.key, 'flag-key');
    assert.equal(config.prod, true);
  }
});

test('env precedence and custom local URL are respected', async (t) => {
  const { root, env } = await fixture(t);
  await fs.writeFile(path.join(root, '.env'), 'CONVEX_SELF_HOSTED_URL=http://default:3210\nCONVEX_SELF_HOSTED_ADMIN_KEY=default-key');
  await fs.writeFile(path.join(root, '.env.local'), 'CONVEX_SELF_HOSTED_URL=http://custom:6543\nCONVEX_SELF_HOSTED_ADMIN_KEY=custom-key\nCONVEX_PROD_URL=https://file-production.example\nCONVEX_PROD_ADMIN_KEY=file-prod-key');
  assert.equal((await pushConfig([], root, {})).url, 'http://custom:6543');
  assert.equal((await pushConfig([], root, env)).url, env.CONVEX_SELF_HOSTED_URL);
  assert.equal((await pushConfig(['--prod'], root, {})).url, 'https://file-production.example');
});

test('unknown flags, missing values and historical commented credentials fail without exposing values', async (t) => {
  const { root, env } = await fixture(t);
  for (const args of [['--unknown=private-value'], ['--key'], ['--url', '--prod'], ['unexpected']]) {
    await assert.rejects(pushConfig(args, root, env), (error) => {
      assert.match(error.message, /Invalid arguments/);
      assert.ok(!error.message.includes('private-value'));
      return true;
    });
  }
  await fs.writeFile(path.join(root, '.env.local'), '# CONVEX_SELF_HOSTED_URL=https://old.proxy.example\n# CONVEX_SELF_HOSTED_ADMIN_KEY=old-key');
  await assert.rejects(pushConfig(['--prod'], root, {}), /Set CONVEX_PROD_URL/);
});

test('help does not require credentials or start a command', async () => {
  const messages = [];
  await pushSchema(await pushConfig(['--help']), { spawnProcess: () => assert.fail('must not spawn'), log: (line) => messages.push(line) });
  assert.match(messages[0], /Usage:/);
});

for (const prod of [false, true]) for (const existing of [false, true]) for (const result of ['success', 'failure', 'SIGINT', 'SIGTERM']) {
  test(`${prod ? 'production' : 'local'} ${result} preserves ${existing ? 'exact env bytes' : 'env absence'}`, async (t) => {
    const { root, env } = await fixture(t);
    const local = path.join(root, '.env.local');
    const original = Buffer.from('# unchanged\r\nVITE_CONVEX_URL=http://custom:9876\r\nOTHER="literal value"\r\n');
    if (existing) await fs.writeFile(local, original, { mode: 0o600 });
    const config = await pushConfig(prod ? ['--prod'] : [], root, env);
    const signals = new EventEmitter();
    const messages = [];
    let killed;
    const spawnProcess = (command, args, options) => {
      assert.equal(command, process.execPath);
      assert.deepEqual(args.slice(1), ['deploy', '--typecheck=disable']);
      assert.equal(options.env.CONVEX_SELF_HOSTED_URL, config.url);
      assert.equal(options.env.CONVEX_SELF_HOSTED_ADMIN_KEY, config.key);
      assert.equal(options.env.CONVEX_DEPLOY_KEY, '');
      assert.equal(options.env.CONVEX_DEPLOYMENT, '');
      assert.equal(options.stdio, 'ignore');
      assert.ok(!args.join(' ').includes(config.key));
      const child = new EventEmitter();
      child.kill = (signal) => { killed = signal; setImmediate(() => child.emit('exit', null, signal)); };
      setImmediate(() => {
        if (result.startsWith('SIG')) signals.emit(result);
        else child.emit('exit', result === 'success' ? 0 : 7, null);
      });
      return child;
    };
    const operation = pushSchema(config, { spawnProcess, signals, log: (line) => messages.push(line) });
    if (result === 'success') await operation;
    else await assert.rejects(operation, (error) => {
      assert.match(error.message, /Schema push failed/);
      if (result.startsWith('SIG')) assert.equal(error.exitCode, result === 'SIGINT' ? 130 : 143);
      return true;
    });
    if (existing) assert.deepEqual(await fs.readFile(local), original);
    else await assert.rejects(fs.stat(local), /ENOENT/);
    assert.equal(messages.some((line) => line.startsWith('Schema pushed successfully')), result === 'success');
    assert.ok(!messages.join('\n').includes(config.key));
    if (result.startsWith('SIG')) assert.equal(killed, result);
    assert.equal(signals.listenerCount('SIGINT'), 0);
    assert.equal(signals.listenerCount('SIGTERM'), 0);
  });
}
