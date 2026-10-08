import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('the Docker production file layout starts the server and serves requests', { timeout: 10000 }, async (t) => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'museum-production-runtime-'));
  t.after(() => fs.rmSync(runtime, { recursive: true, force: true }));
  const production = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8').split(/FROM .* AS production/i)[1];
  assert.ok(production, 'Dockerfile must define a production stage');
  // Materialize source COPY instructions, rather than exposing the repository
  // tree, which would conceal missing files in the production image.
  for (const [, sources, target] of production.matchAll(/^COPY (?!.*--from=)(.+) (\S+)$/gm)) {
    for (const source of sources.split(/\s+/)) {
      if (source === 'public/uploads') {
        fs.mkdirSync(path.join(runtime, target), { recursive: true });
        continue;
      }
      const filenames = source.includes('*') ? ['package-lock.json'] : [source];
      for (const filename of filenames) {
        const destination = target.endsWith('/') ? path.join(runtime, target, path.basename(filename)) : path.join(runtime, target);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.cpSync(path.join(root, filename), destination, { recursive: true });
      }
    }
  }
  fs.mkdirSync(path.join(runtime, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(runtime, 'dist/index.html'), '<html>Production fixture</html>');
  // Package installation is verified separately; source availability must be
  // tested from the image layout without copying any ignored environment files.
  fs.symlinkSync(fs.realpathSync(path.join(root, 'node_modules')), path.join(runtime, 'node_modules'), 'dir');
  assert.ok(JSON.parse(fs.readFileSync(path.join(runtime, 'package.json'))).dependencies['mdast-util-from-markdown']);
  const child = spawn(process.execPath, ['--input-type=module', '--eval', `
    import http from 'node:http';
    const listen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
      this.once('listening', () => process.send({ port: this.address().port }));
      return listen.apply(this, args);
    };
    await import('./server/index.js');
  `], { cwd: runtime, env: { PORT: '0', ADMIN_PASSWORD: 'fixture-only' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  const exited = once(child, 'exit');
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) child.kill(); await exited; });
  const ready = await Promise.race([
    once(child, 'message').then(([message]) => message),
    exited.then(() => { throw new Error(`Production server exited before listening: ${errors}`); }),
  ]);
  const origin = `http://127.0.0.1:${ready.port}`;
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Production fixture/);
  const unauthorized = await fetch(`${origin}/api/list-uploads`);
  assert.equal(unauthorized.status, 401);
});
