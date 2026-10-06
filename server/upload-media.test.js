import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable, PassThrough, Writable } from 'node:stream';
import { spawnSync } from 'node:child_process';
import { uploadMedia } from './api-handlers.js';
import { UPLOAD_LIMITS } from './upload-media.js';

const boundary = 'museum-upload-test';
const headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
let root;
const directory = () => path.join(root, 'public/uploads');
const files = async () => fs.promises.readdir(directory());
const part = (filename = 'photo.jpg', mime = 'image/jpeg', content = '\xff\xd8\xffmedia bytes') =>
  `--${boundary}\r\nContent-Disposition: form-data; name="file"${filename === null ? '' : `; filename="${filename}"`}\r\nContent-Type: ${mime}\r\n\r\n${content}\r\n`;
const request = (parts) => Readable.from([Buffer.from(parts + `--${boundary}--\r\n`, 'latin1')]);
const upload = (parts) => uploadMedia(root, headers, request(parts));
const rejectedWith = (status) => (error) => error.status === status;

beforeEach(async () => {
  root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'museum-upload-'));
});
afterEach(async () => {
  mock.restoreAll();
  await fs.promises.rm(root, { recursive: true, force: true });
});

test('same filenames and stems produce distinct immutable asset identities without overwriting', async () => {
  const first = await upload(part());
  const next = await upload(part('PHOTO.JPG', 'image/jpeg', '\xff\xd8\xffsecond') + part('photo.png', 'image/png', '\x89PNG\r\n\x1a\nthird'));
  const assets = [...first.assets, ...next.assets];
  assert.equal(new Set(assets.map((asset) => asset.id)).size, 3);
  assert.equal(new Set(assets.map((asset) => asset.url)).size, 3);
  assert.equal(await fs.promises.readFile(path.join(root, 'public', first.url), 'latin1'), '\xff\xd8\xffmedia bytes');
  assert.deepEqual(await Promise.all(next.urls.map((url) => fs.promises.readFile(path.join(root, 'public', url), 'latin1'))), ['\xff\xd8\xffsecond', '\x89PNG\r\n\x1a\nthird']);
  assert.equal(next.assets[0].name, 'PHOTO.JPG');
  assert.equal(next.assets[0].type, 'image');
});

test('rejects active documents and media MIME/extension mismatches', async () => {
  for (const [name, mime] of [['page.html', 'text/html'], ['drawing.svg', 'image/svg+xml'], ['photo.jpg', 'text/html'], ['clip.mp4', 'image/jpeg']]) {
    await assert.rejects(upload(part(name, mime)), rejectedWith(415));
    assert.deepEqual(await files(), []);
  }
});

test('accepts supported image, audio and video types', async () => {
  const result = await upload(part('image.webp', 'image/webp', 'RIFF1234WEBP') + part('sound.mp3', 'audio/mpeg', 'ID3sound') + part('movie.webm', 'video/webm', '\x1a\x45\xdf\xa3movie'));
  assert.deepEqual(result.assets.map((asset) => asset.type), ['image', 'audio', 'video']);
  assert.equal((await files()).length, 3);
});

test('rejects empty media and HTML/SVG bytes even with allowed filenames and MIME types', async () => {
  for (const content of ['', '<!doctype html><script>alert(1)</script>', '<svg xmlns="http://www.w3.org/2000/svg"></svg>']) {
    await assert.rejects(upload(part('photo.jpg', 'image/jpeg', content)), rejectedWith(415));
    assert.deepEqual(await files(), []);
  }
  await assert.rejects(upload(part() + part('photo.png', 'image/png', '<html>disguised</html>')), rejectedWith(415));
  assert.deepEqual(await files(), []);
});

test('preserves bytes and supports signatures for every allowed extension, including classic QuickTime', async () => {
  const formats = [
    ['jpg', 'image/jpeg', '\xff\xd8\xff'], ['jpeg', 'image/jpeg', '\xff\xd8\xff'],
    ['png', 'image/png', '\x89PNG\r\n\x1a\n'], ['gif', 'image/gif', 'GIF89a'],
    ['webp', 'image/webp', 'RIFF1234WEBP'], ['avif', 'image/avif', '1234ftypavif'],
    ['bmp', 'image/bmp', 'BM'], ['mp3', 'audio/mpeg', 'ID3'], ['mp3', 'audio/mpeg', '\xff\xfb'],
    ['wav', 'audio/wav', 'RIFF1234WAVE'], ['ogg', 'audio/ogg', 'OggS'], ['oga', 'audio/ogg', 'OggS'],
    ['flac', 'audio/flac', 'fLaC'], ['aac', 'audio/aac', '\xff\xf1'], ['aac', 'audio/aac', 'ADIF'],
    ['m4a', 'audio/mp4', '1234ftypM4A '], ['mp4', 'video/mp4', '1234ftypisom'],
    ['m4v', 'video/mp4', '1234ftypisom'], ['webm', 'video/webm', '\x1a\x45\xdf\xa3'],
    ['ogv', 'video/ogg', 'OggS'], ['mov', 'video/quicktime', '1234ftypqt  '],
    ['mov', 'video/quicktime', '1234wide'],
  ];
  for (const [extension, mime, signature] of formats) {
    const content = signature + 'fixture payload';
    const result = await upload(part(`fixture.${extension}`, mime, content));
    assert.deepEqual(await fs.promises.readFile(path.join(root, 'public', result.url)), Buffer.from(content, 'latin1'));
  }
});

test('validates split header chunks without retaining a whole media file in memory', async () => {
  const body = Buffer.from(part('clip.mp4', 'video/mp4', '1234ftypisom' + 'payload'.repeat(32)) + `--${boundary}--\r\n`, 'latin1');
  async function* bytes() { for (const byte of body) yield Buffer.from([byte]); }
  const result = await uploadMedia(root, headers, Readable.from(bytes()));
  assert.equal((await fs.promises.readFile(path.join(root, 'public', result.url))).toString(), '1234ftypisom' + 'payload'.repeat(32));
});

test('nameless octet-stream file, invalid multipart and empty uploads return validation errors', async () => {
  await assert.rejects(upload(part(null, 'application/octet-stream')), rejectedWith(400));
  await assert.rejects(uploadMedia(root, {}, Readable.from([])), rejectedWith(400));
  await assert.rejects(upload(''), rejectedWith(400));
  assert.deepEqual(await files(), []);
});

test('rejecting a still-open multipart file does not crash the process', () => {
  for (const [filename, mime, status] of [['page.html', 'text/html', 415], [null, 'application/octet-stream', 400]]) {
    const script = `
      import assert from 'node:assert/strict';
      import { PassThrough } from 'node:stream';
      import { uploadMedia } from ${JSON.stringify(new URL('./api-handlers.js', import.meta.url).href)};
      const stream = new PassThrough();
      const uploading = uploadMedia(${JSON.stringify(root)}, ${JSON.stringify(headers)}, stream);
      stream.write(${JSON.stringify(part(filename, mime).slice(0, -2))});
      await assert.rejects(uploading, error => error.status === ${status});
      stream.end();
    `;
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
  }
});

test('limits file counts and rolls back earlier files when a later part is rejected', async () => {
  await assert.rejects(upload(part().repeat(UPLOAD_LIMITS.files + 1)), rejectedWith(413));
  assert.deepEqual(await files(), []);
  await assert.rejects(upload(part() + part('page.html', 'text/html')), rejectedWith(415));
  assert.deepEqual(await files(), []);
});

test('accepts the maximum file count and rejects form fields', async () => {
  await upload(part().repeat(UPLOAD_LIMITS.files));
  const initialFiles = await files();
  const field = `--${boundary}\r\nContent-Disposition: form-data; name="unused"\r\n\r\nvalue\r\n`;
  await assert.rejects(upload(part() + field), rejectedWith(413));
  assert.deepEqual(await files(), initialFiles);
});

test('oversized streamed files are rejected and removed', async () => {
  async function* chunks() {
    yield part('large.mp4', 'video/mp4', '').slice(0, -2);
    const chunk = Buffer.alloc(1024 * 1024, 1);
    chunk.write('ftyp', 4);
    for (let count = 0; count <= UPLOAD_LIMITS.fileBytes / chunk.length; count++) yield chunk;
    yield `\r\n--${boundary}--\r\n`;
  }
  await assert.rejects(uploadMedia(root, headers, Readable.from(chunks())), rejectedWith(413));
  assert.deepEqual(await files(), []);
});

test('accepts a file exactly at the size boundary', async () => {
  async function* chunks() {
    yield part('large.mp4', 'video/mp4', '').slice(0, -2);
    const chunk = Buffer.alloc(1024 * 1024, 1);
    chunk.write('ftyp', 4);
    for (let count = 0; count < UPLOAD_LIMITS.fileBytes / chunk.length; count++) yield chunk;
    yield `\r\n--${boundary}--\r\n`;
  }
  const result = await uploadMedia(root, headers, Readable.from(chunks()));
  assert.equal((await fs.promises.stat(path.join(root, 'public', result.url))).size, UPLOAD_LIMITS.fileBytes);
});

test('bounds declared request size and chunked multipart preambles', async () => {
  const bytes = UPLOAD_LIMITS.files * UPLOAD_LIMITS.fileBytes + 64 * 1024;
  await assert.rejects(uploadMedia(root, { ...headers, 'content-length': String(bytes + 1) }, request(part())), rejectedWith(413));
  async function* preamble() {
    const chunk = Buffer.alloc(1024 * 1024, 32);
    for (let count = 0; count <= bytes / chunk.length; count++) yield chunk;
    yield part() + `--${boundary}--\r\n`;
  }
  await assert.rejects(uploadMedia(root, headers, Readable.from(preamble())), rejectedWith(413));
  assert.deepEqual(await files(), []);
});

test('does not report success until the output stream has finished', async () => {
  let finish;
  mock.method(fs, 'createWriteStream', () => new Writable({
    write(_chunk, _encoding, callback) { callback(); },
    final(callback) { finish = callback; },
  }));
  let resolved = false;
  const uploading = upload(part()).then(() => { resolved = true; });
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(resolved, false);
  finish();
  await uploading;
  assert.equal(resolved, true);
});

test('write errors reject instead of crashing and remove every file created by the request', async () => {
  const createWriteStream = fs.createWriteStream;
  mock.method(fs, 'createWriteStream', (filename, options) => {
    const output = createWriteStream(filename, options);
    output.once('open', () => output.destroy(Object.assign(new Error('Disk is full'), { code: 'ENOSPC' })));
    return output;
  });
  await assert.rejects(upload(part() + part('second.png', 'image/png')), { code: 'ENOSPC' });
  assert.deepEqual(await files(), []);
});

test('an exclusive-write collision never removes the pre-existing file', async () => {
  const createWriteStream = fs.createWriteStream;
  mock.method(fs, 'createWriteStream', (filename, options) => {
    fs.writeFileSync(filename, 'existing asset');
    return createWriteStream(filename, options);
  });
  await assert.rejects(upload(part()), { code: 'EEXIST' });
  const names = await files();
  assert.equal(names.length, 1);
  assert.equal(await fs.promises.readFile(path.join(directory(), names[0]), 'utf8'), 'existing asset');
});

test('malformed multipart bodies and interrupted requests remove partial uploads', async () => {
  await assert.rejects(uploadMedia(root, headers, Readable.from([part()])), rejectedWith(400));
  assert.deepEqual(await files(), []);
  const stream = new PassThrough();
  const uploading = uploadMedia(root, headers, stream);
  stream.write(Buffer.from(part().slice(0, -2), 'latin1'));
  while (!(await files()).length) await new Promise((resolve) => setImmediate(resolve));
  stream.destroy();
  await assert.rejects(uploading, rejectedWith(400));
  assert.deepEqual(await files(), []);
});
