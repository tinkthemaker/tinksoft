import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

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
