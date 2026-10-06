import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = parse(await fs.readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8'));
const job = workflow.jobs['push-convex-schema'];
const credentials = job.steps.find((step) => step.id === 'deployment');
const deploy = job.steps.find((step) => step.name === 'Push schema to Sevalla Convex backend');

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'museum-schema-ci-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  return dir;
}

test('schema guards retain the supported runtime and native regression gate', () => {
  for (const currentJob of Object.values(workflow.jobs)) {
    for (const step of currentJob.steps.filter((item) => item.uses === 'actions/setup-node@v4')) {
      assert.equal(step.with['node-version'], 22);
    }
  }
  assert.ok(workflow.jobs.test.steps.some((step) => step.run === 'npm run test:node'));
});

test('production schema jobs serialize and only gated steps can deploy', () => {
  assert.equal(job.concurrency.group, 'convex-production-schema');
  assert.equal(job.concurrency['cancel-in-progress'], false);
  assert.equal(job.concurrency.queue, 'max');
  assert.deepEqual(job.permissions, { contents: 'read' });
  assert.match(job.if, /github.event_name == 'push'/);
  assert.match(job.if, /refs\/heads\/main/);
  for (const step of job.steps.filter((step) => step !== credentials)) {
    assert.equal(step.if, "steps.deployment.outputs.enabled == 'true'");
  }
  assert.equal(deploy.env.GH_TOKEN, '${{ github.token }}');
});

test('missing and partial secrets skip deployment without printing credential values', async (t) => {
  const dir = await fixture(t);
  for (const [url, key] of [['', ''], ['https://fixture.example', ''], ['', 'fixture-private-key']]) {
    const output = path.join(dir, `outputs-${Math.random()}`);
    const result = spawnSync('bash', ['-c', credentials.run], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, CONVEX_PROD_URL: url, CONVEX_PROD_ADMIN_KEY: key, GITHUB_OUTPUT: output },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await fs.readFile(output, 'utf8'), 'enabled=false\n');
    assert.match(result.stdout, /Skipping schema deployment/);
    assert.ok(!result.stdout.includes('fixture-private-key'));
    assert.ok(!result.stdout.includes('https://fixture.example'));
  }
});

test('configured credentials enable the guarded steps without printing keys', async (t) => {
  const dir = await fixture(t);
  const output = path.join(dir, 'outputs');
  const result = spawnSync('bash', ['-c', credentials.run], {
    cwd: dir, encoding: 'utf8', env: { ...process.env, CONVEX_PROD_URL: 'https://fixture.example', CONVEX_PROD_ADMIN_KEY: 'fixture-private-key', GITHUB_OUTPUT: output },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await fs.readFile(output, 'utf8'), 'enabled=true\n');
  assert.equal(result.stdout, '');
});

for (const scenario of ['current', 'stale', 'api-failure']) {
  test(`${scenario} main-head check ${scenario === 'current' ? 'allows' : 'prevents'} the stub deployment`, async (t) => {
    const dir = await fixture(t);
    const bin = path.join(dir, 'bin');
    await fs.mkdir(bin);
    await fs.mkdir(path.join(dir, 'scripts'));
    const called = path.join(dir, 'deployment-called');
    const requested = path.join(dir, 'api-requested');
    await fs.writeFile(path.join(bin, 'gh'), '#!/bin/sh\nprintf "%s" "$*" > "$TEST_REQUEST"\nif [ "$TEST_API_STATUS" != 0 ]; then exit "$TEST_API_STATUS"; fi\nprintf "%s\\n" "$TEST_MAIN_SHA"\n', { mode: 0o700 });
    await fs.writeFile(path.join(dir, 'scripts/push-convex.sh'), '#!/bin/sh\nprintf "%s" "$*" > "$TEST_CALLED"\n', { mode: 0o700 });
    const result = spawnSync('bash', ['-c', deploy.run], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`,
        GITHUB_REPOSITORY: 'fixture/museum', GITHUB_SHA: 'current-commit', GH_TOKEN: 'fixture-token',
        TEST_MAIN_SHA: scenario === 'stale' ? 'newer-commit' : 'current-commit',
        TEST_API_STATUS: scenario === 'api-failure' ? '9' : '0', TEST_CALLED: called, TEST_REQUEST: requested },
    });
    assert.equal(result.status, scenario === 'api-failure' ? 9 : 0);
    assert.equal(await fs.readFile(requested, 'utf8'), 'api repos/fixture/museum/git/ref/heads/main --jq .object.sha');
    if (scenario === 'current') assert.equal(await fs.readFile(called, 'utf8'), '--prod');
    else await assert.rejects(fs.stat(called), /ENOENT/);
    if (scenario === 'stale') assert.match(result.stdout, /Skipping outdated schema deployment/);
    assert.ok(!result.stdout.includes('fixture-token'));
  });
}
