import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scripts = fileURLToPath(new URL('../scripts/', import.meta.url));
const zipName = 'tinksoft-20260903.zip';
const zipPath = `dist/releases/${zipName}`;
const html = (body) => `<!doctype html><html lang="en"><head><title>Fixture</title></head><body><main id="main"><h1>Fixture</h1>${body}</main></body></html>`;

function write(root, name, contents) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function run(root, script) {
  const result = spawnSync(process.execPath, [join(scripts, script)], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SOURCE_DATE_EPOCH: '1788436800' },
  });
  assert.ifError(result.error);
  return result;
}

function generate(root, script) {
  const result = run(root, script);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tinksoft-validator-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, 'public/tinksoft.nfo', 'Fixture NFO\n');
  write(root, 'dist/log/hello.txt', 'Hello from the log.\n');
  write(root, 'dist/index.html', html('<a href="/log/hello.txt">Text</a><a href="#main">Main</a><a href="/releases/">Release</a>'));
  write(root, 'dist/releases/index.html', html('<a href="@REL_PATH@">@REL_NAME@</a><p>@REL_SHA@</p>'));
  generate(root, 'release.mjs');
  generate(root, 'checksums.mjs');
  return root;
}

function expectFailure(root, diagnostic) {
  const result = run(root, 'validate-build.mjs');
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, diagnostic);
}

test('build validator accepts a complete site with local links, fragments, and a release', (t) => {
  const root = fixture(t);
  const result = run(root, 'validate-build.mjs');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 HTML pages, 4 manifest entries, 4 release entries verified/);
});

for (const [name, body, diagnostic] of [
  ['broken local links', '<a href="/missing/">Missing</a>', /broken local reference \/missing\//],
  ['missing fragment targets', '<a href="/releases/#missing">Missing section</a>', /missing fragment target \/releases\/#missing/],
  ['unresolved build placeholders', '<p>@BUILD_TIME@</p>', /unresolved placeholder\(s\): @BUILD_TIME@/],
  ['duplicate IDs', '<p id="main">Duplicate</p>', /duplicate id\(s\): main/],
  ['executable scripts', '<script>console.log("unexpected")</script>', /executable <script> is not allowed/],
  ['images without accessible text', '<img src="data:image/svg+xml,test" width="1" height="1">', /image is missing alt text/],
  ['javascript: links', '<a href="javascript:alert(1)">x</a>', /unsafe URL scheme in <a href> javascript:/],
  ['tab-obfuscated javascript: links', '<a href="java\tscript:alert(1)">x</a>', /unsafe URL scheme in <a href>/],
  ['whitespace-prefixed javascript: links', '<a href="  javascript:alert(1)">x</a>', /unsafe URL scheme in <a href>/],
  ['entity-encoded javascript: links', '<a href="java&Tab;script&colon;alert(1)">x</a>', /unsafe URL scheme in <a href>/],
  ['numeric-entity-encoded javascript: links', '<a href="&#x6A;avascript:alert(1)">x</a>', /unsafe URL scheme in <a href>/],
  ['vbscript: links', '<a href="vbscript:msgbox(1)">x</a>', /unsafe URL scheme in <a href> vbscript:/],
  ['data: links', '<a href="data:text/html,test">x</a>', /unsafe URL scheme in <a href> data:/],
  ['non-image data: image sources', '<img src="data:text/html,test" alt="x" width="1" height="1">', /unsafe URL scheme in <img src> data:/],
  ['inline event handlers', '<img src="/log/hello.txt" alt="x" width="1" height="1" onerror="alert(1)">', /inline event handler on <img>/],
  ['inline event handlers without whitespace', '<p title="x"onclick="alert(1)">x</p>', /inline event handler on <p>/],
  ['meta refresh redirects', '<meta http-equiv="refresh" content="0;url=https://attacker.example">', /<meta http-equiv="refresh"> is not allowed/],
  ['unquoted meta refresh redirects', '<meta http-equiv=refresh content="0;url=https://attacker.example">', /<meta http-equiv="refresh"> is not allowed/],
]) {
  test(`build validator rejects ${name}`, (t) => {
    const root = fixture(t);
    write(root, 'dist/index.html', html(body));
    // Keep the manifest valid so the HTML defect is the reason validation fails.
    generate(root, 'checksums.mjs');
    expectFailure(root, diagnostic);
  });
}

test('build validator allows structured data, encoded fragment targets, and safe URL schemes', (t) => {
  const root = fixture(t);
  write(root, 'dist/index.html', html('<p id="café">Target</p><a href="#caf%C3%A9">Jump</a><script type="application/ld+json">{"@type":"WebPage"}</script><a href="https://example.com/?a=1&amp;b=2">Out</a><a href="mailto:hi@example.com">Mail</a><a href="tel:+15555550100">Call</a><img src="data:image/svg+xml,test" alt="icon" width="1" height="1"><link rel="icon" href="data:image/svg+xml,test">'));
  generate(root, 'checksums.mjs');
  generate(root, 'validate-build.mjs');
});

test('build validator rejects files changed after checksums were generated', (t) => {
  const root = fixture(t);
  write(root, 'dist/log/hello.txt', 'Changed after hashing.\n');
  expectFailure(root, /hash mismatch for log\/hello\.txt/);
});

test('build validator rejects files omitted from the manifest', (t) => {
  const root = fixture(t);
  write(root, 'dist/new.txt', 'Not in the manifest.\n');
  expectFailure(root, /\/checksums\.txt: missing new\.txt/);
});

test('build validator rejects stale release checksums on the download page', (t) => {
  const root = fixture(t);
  write(root, 'dist/releases/index.html', html(`<a href="/releases/${zipName}">Download</a>`));
  generate(root, 'checksums.mjs');
  expectFailure(root, /page does not contain the ZIP checksum/);
});

test('build validator rejects truncated release archives even when outer checksums match', (t) => {
  const root = fixture(t);
  const original = readFileSync(join(root, zipPath));
  const truncated = original.subarray(0, original.length - 22);
  write(root, zipPath, truncated);
  const hash = createHash('sha256').update(truncated).digest('hex');
  write(root, 'dist/releases/index.html', html(`<a href="/releases/${zipName}">Download</a><p>${hash}</p>`));
  generate(root, 'checksums.mjs');
  expectFailure(root, /invalid ZIP: missing end-of-central-directory record/);
});

test('build validator rejects archive contents that disagree with SHA256SUMS', (t) => {
  const root = fixture(t);
  const zip = readFileSync(join(root, zipPath));
  // Change the filename in both ZIP headers without changing the inner manifest.
  const renamed = Buffer.from(zip.toString('latin1').replaceAll('LOG/hello.txt', 'LOG/jello.txt'), 'latin1');
  write(root, zipPath, renamed);
  const hash = createHash('sha256').update(renamed).digest('hex');
  write(root, 'dist/releases/index.html', html(`<a href="/releases/${zipName}">Download</a><p>${hash}</p>`));
  generate(root, 'checksums.mjs');
  expectFailure(root, /checksum mismatch for LOG\/jello\.txt/);
  expectFailure(root, /SHA256SUMS names missing entry LOG\/hello\.txt/);
});
