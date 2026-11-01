import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = parse(await fs.readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8'));

test('CI retains the supported runtime and native regression gate', () => {
  for (const currentJob of Object.values(workflow.jobs)) {
    for (const step of currentJob.steps.filter((item) => item.uses === 'actions/setup-node@v4')) {
      assert.equal(step.with['node-version'], 22);
    }
  }
  assert.ok(workflow.jobs.test.steps.some((step) => step.run === 'npm run test:node'));
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
