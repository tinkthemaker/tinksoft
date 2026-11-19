import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const squash = (text) => text.replace(/\s+/g, '');
const base = () => read('src/layouts/Base.astro');

test('fonts are self-hosted woff2 files within their size ceilings, with licenses', () => {
  for (const [file, ceiling] of [['grenze-gotisch-700.woff2', 25600], ['silkscreen-400.woff2', 10240]]) {
    const url = new URL(`../public/fonts/${file}`, import.meta.url);
    assert.equal(readFileSync(url).subarray(0, 4).toString('latin1'), 'wOF2', file);
    assert.ok(statSync(url).size <= ceiling, `${file} is ${statSync(url).size} B`);
  }
  for (const file of ['LICENSE-grenze-gotisch.txt', 'LICENSE-silkscreen.txt', 'SOURCE.txt']) {
    assert.ok(existsSync(new URL(`../public/fonts/${file}`, import.meta.url)), file);
  }
});

test('the CSP allows self-hosted fonts and nothing else new', () => {
  assert.match(base(), /content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'"/);
});

test('Grenze Gotisch is preloaded with crossorigin; Silkscreen is not', () => {
  assert.match(base(), /<link rel="preload" href="\/fonts\/grenze-gotisch-700\.woff2" as="font" type="font\/woff2" crossorigin/);
  assert.doesNotMatch(base(), /rel="preload"[^>]*silkscreen/);
});

test('both faces swap in, and every use has a fallback stack', () => {
  const css = squash(base());
  assert.equal((css.match(/font-display:swap/g) ?? []).length, 2);
  assert.ok(css.includes('--f-display:"GrenzeGotisch",var(--serif)'));
  assert.ok(css.includes('--f-plate:"Silkscreen",var(--mono)'));
});

const RETIRED = ['#006661', '#49d6c9', '#008080', '#3fbdb0', '#33ff33', '#0039a6', '#82adff', '#9c2dad', '#d66cff'];
function files(dir) {
  const root = fileURLToPath(new URL(`../${dir}`, import.meta.url));
  return readdirSync(root, { recursive: true }).map((f) => join(root, String(f))).filter((f) => /\.(astro|mjs|css|svg|md)$/.test(f));
}

test('no retired teal, purple or link-blue colours remain', () => {
  for (const file of [...files('src'), ...files('public')]) {
    const text = readFileSync(file, 'utf8').toLowerCase();
    for (const hex of RETIRED) assert.ok(!text.includes(hex), `${hex} in ${file}`);
  }
});

test('colour tokens come only from theme.mjs', () => {
  assert.doesNotMatch(base(), /--bg\s*:/);
  assert.match(base(), /themeCss\(\{ \.\.\.ART, torches: TORCHES \}\)/);
});

test('theme-color metas match the new backgrounds', () => {
  assert.match(base(), /<meta name="theme-color" content="#b99568" media="\(prefers-color-scheme: light\)"/);
  assert.match(base(), /<meta name="theme-color" content="#1c130c" media="\(prefers-color-scheme: dark\)"/);
});

test('every link highlight wins over page styles, and its children inherit', () => {
  const css = squash(base());
  assert.ok(css.includes('a:hover,a:focus-visible{color:var(--hi-ink)!important;background-color:var(--hi-bg)!important;'));
  assert.ok(css.includes('a:is(:hover,:focus-visible)*{color:inherit!important;}'));
});
