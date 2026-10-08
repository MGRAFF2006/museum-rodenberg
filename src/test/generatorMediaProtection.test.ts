// @vitest-environment node
import { expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

it('keeps media IDs, references and URLs intact in the actual translation generator', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'museum-generator-media-'));
  const sent: string[] = [];
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const { q } = JSON.parse(body) as { q: string };
    sent.push(q);
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ translatedText: q.split('Museum').join('Translated').split('asset(1)').join('broken-id').split('/uploads/').join('/broken/').split('[picture]').join('[broken]') }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    await Promise.all(['scripts', 'src/utils', 'src/content', 'public/translations'].map(dir => fs.mkdir(path.join(root, dir), { recursive: true })));
    await fs.copyFile(new URL('../../scripts/generate-translations.js', import.meta.url), path.join(root, 'scripts/generate-translations.js'));
    await fs.copyFile(new URL('../utils/markdownParsing.js', import.meta.url), path.join(root, 'src/utils/markdownParsing.js'));
    await fs.symlink(new URL('../../node_modules', import.meta.url).pathname, path.join(root, 'node_modules'));
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await fs.writeFile(path.join(root, 'public/translations/de.json'), JSON.stringify({ museum: 'Museum' }));
    const description = 'Museum ![Photo](asset(1)) and [Article](https://example.com/page(1))';
    const detailed = 'Museum ![Detail][picture]\n\n[picture]: /uploads/detail(1).jpg\n\nMuseum [Audio: Guide](audio:/uploads/guide(1).mp3)';
    await fs.writeFile(path.join(root, 'src/content/exhibitions.json'), JSON.stringify({ exhibitions: { item: { translations: { de: { title: 'Museum', description } }, detailedContent: { de: detailed } } } }));
    await fs.writeFile(path.join(root, 'src/content/artifacts.json'), '{"artifacts":{}}');
    await promisify(execFile)(process.execPath, [path.join(root, 'scripts/generate-translations.js')], {
      cwd: root, timeout: 10000,
      env: { ...process.env, LIBRETRANSLATE_API_URL: `http://127.0.0.1:${address.port}`, LIBRETRANSLATE_API_KEY: '' },
    });
    const data = JSON.parse(await fs.readFile(path.join(root, 'src/content/exhibitions.json'), 'utf8'));
    for (const language of ['en', 'fr', 'es', 'it', 'nl', 'pl']) {
      expect(data.exhibitions.item.translations[language].description).toBe(description.split('Museum').join('Translated'));
      expect(data.exhibitions.item.detailedContent[language]).toBe(detailed.split('Museum').join('Translated'));
    }
    expect(sent.some(text => /__[a-f0-9]{32}_\d+__/.test(text))).toBe(true);
    expect(sent.some(text => text.includes('asset(1)') || text.includes('/uploads/') || text.includes('[picture]'))).toBe(false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await fs.rm(root, { recursive: true, force: true });
  }
});
