import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = parse(await fs.readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8'));

// Expressions and raw outcomes are part of the CI execution contract.
const required = ['checkout', 'node', 'install', 'lint', 'typecheck', 'vitest', 'native', 'build', 'artifact'];
const checks = {
  lint: 'npm run lint',
  typecheck: 'npm run typecheck',
  vitest: 'npm test -- --run',
  native: 'npm run test:node',
};
const job = workflow.jobs.check;
const stepById = (id) => job.steps.find((step) => step.id === id);

test('CI retains one active Node 22 Boat job and the full native regression gate', () => {
  assert.deepEqual(Object.keys(workflow.jobs), ['check']);
  assert.equal(job['runs-on'], 'boat');
  assert.equal(job.if, undefined);
  assert.equal(job['continue-on-error'], undefined);
  for (const trigger of [workflow.on.push, workflow.on.pull_request]) {
    assert.equal(trigger.paths, undefined);
    assert.equal(trigger['paths-ignore'], undefined);
  }
  assert.equal(job['timeout-minutes'], 60);
  assert.equal(job.steps.filter((step) => step.uses?.startsWith('actions/checkout@')).length, 1);
  assert.equal(job.steps.filter((step) => step.uses?.startsWith('actions/setup-node@')).length, 1);
  const node = stepById('node');
  assert.equal(node.uses, 'actions/setup-node@v4');
  assert.equal(node.with['node-version'], 22);
  assert.equal(node.with.cache, 'npm');
  assert.equal(job.steps.filter((step) => step.run === 'npm ci').length, 1);
  assert.equal(stepById('install').run, 'npm ci');
  for (const id of ['checkout', 'node', 'install']) {
    assert.equal(stepById(id).if, undefined);
    assert.equal(stepById(id)['continue-on-error'], undefined);
  }
  assert.ok(job.steps.indexOf(stepById('checkout')) < job.steps.indexOf(node));
  assert.ok(job.steps.indexOf(node) < job.steps.indexOf(stepById('install')));
});

test('all lint, typecheck and test commands remain independent after installation', () => {
  for (const [id, command] of Object.entries(checks)) {
    const step = stepById(id);
    assert.equal(step.run, command);
    assert.equal(step.if, "${{ !cancelled() && steps.install.outcome == 'success' }}");
    assert.equal(step['continue-on-error'], true);
    assert.ok(job.steps.indexOf(step) > job.steps.indexOf(stepById('install')));
    assert.ok(job.steps.indexOf(step) < job.steps.indexOf(stepById('build')));
  }
});

test('build requires actual success of every prerequisite and retains the dist artifact', () => {
  const build = stepById('build');
  assert.equal(build.run, 'npm run build');
  assert.equal(build.if, "${{ !cancelled() && steps.install.outcome == 'success' && steps.lint.outcome == 'success' && steps.typecheck.outcome == 'success' && steps.vitest.outcome == 'success' && steps.native.outcome == 'success' }}");
  assert.equal(build['continue-on-error'], undefined);
  const artifact = stepById('artifact');
  assert.equal(artifact.uses, 'actions/upload-artifact@v4');
  assert.equal(artifact.if, "${{ !cancelled() && steps.build.outcome == 'success' }}");
  assert.equal(artifact['continue-on-error'], undefined);
  assert.deepEqual(artifact.with, { name: 'dist', path: 'dist/', 'retention-days': 7 });
  assert.ok(job.steps.indexOf(artifact) > job.steps.indexOf(build));
});

test('the final gate fails closed for every unsuccessful or missing required outcome', () => {
  const gate = stepById('gate');
  assert.equal(job.steps.at(-1), gate);
  assert.equal(gate.if, '${{ always() }}');
  assert.equal(gate['continue-on-error'], undefined);
  assert.equal(gate.shell, 'bash');
  assert.deepEqual(Object.keys(gate.env).sort(), required.map((id) => `${id.toUpperCase()}_RESULT`).sort());
  const success = {};
  for (const id of required) {
    const key = `${id.toUpperCase()}_RESULT`;
    assert.equal(gate.env[key], '${{ steps.' + id + '.outcome }}');
    success[key] = 'success';
  }
  const runGate = (results) => {
    const result = spawnSync('bash', ['--noprofile', '--norc', '-c', gate.run], {
      env: results, encoding: 'utf8', timeout: 5000,
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return result.status;
  };
  assert.equal(runGate(success), 0);
  for (const key of Object.keys(success)) {
    for (const outcome of ['failure', 'skipped', 'cancelled', '', 'unexpected']) {
      assert.equal(runGate({ ...success, [key]: outcome }), 1, `${key}: ${outcome}`);
    }
    const missing = { ...success };
    delete missing[key];
    assert.equal(runGate(missing), 1, `${key}: missing`);
  }
});

test('CI cannot invoke the retired production schema deployment', () => {
  assert.equal(workflow.jobs['push-convex-schema'], undefined);
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      assert.ok(!Object.keys(step.env ?? {}).some((key) => key.startsWith('CONVEX_PROD_')));
      assert.doesNotMatch(step.run ?? '', /push-convex\.(?:sh|mjs)|\bconvex\s+deploy\b|npm\s+run\s+convex:push/);
    }
  }
});
