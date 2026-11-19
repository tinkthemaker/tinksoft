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

test('the ASCII logo is gone and the wordmark is a real-text link home', () => {
  assert.doesNotMatch(base(), /class="ascii"|a\.logo/);
  assert.match(base(), /<a class="wordmark" href="\/"><span class="ini">T<\/span>inkSoft<\/a>/);
});

test('the wordmark survives forced colours', () => {
  const css = squash(base());
  const block = css.slice(css.indexOf('@media(forced-colors:active)'));
  assert.ok(block.startsWith('@media(forced-colors:active)'), 'forced-colors block present');
  assert.match(block, /\.wordmark\{-webkit-text-fill-color:currentColor;background:none;filter:none;?\}/);
});

test('the torch flicker stops for reduced motion and uses the generated positions', () => {
  const css = squash(base());
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^@]*\.viewport::before,\.viewport::after\{animation:none;?\}/);
  assert.ok(css.includes('var(--torch-l)') && css.includes('var(--torch-r)'));
  assert.ok(css.includes('steps(1)'));
});

const FLEURONS = /[❦☙❧]/;

test('no Unicode fleurons anywhere in src', () => {
  for (const file of files('src')) assert.doesNotMatch(readFileSync(file, 'utf8'), FLEURONS, file);
});

test('bracketed labels survive only on eyebrows and footer headings', () => {
  for (const file of files('src').filter((f) => f.endsWith('.astro'))) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (/>\[[A-Z0-9 /.:-]+\]</.test(line)) assert.match(line, /class="(eyebrow|footer-heading)"/, `${file}: ${line.trim()}`);
    }
  }
});

test('prose headings use the diamond, not the old // prefix', () => {
  assert.doesNotMatch(base(), /content:\s*'\/\/ '/);
  assert.match(squash(base()), /\.content>h2::before/);
});

test('the footer divider is three CSS diamonds', () => {
  assert.match(base(), /<div class="divider" aria-hidden="true"><i class="gem sm"><\/i><i class="gem"><\/i><i class="gem sm"><\/i><\/div>/);
});

test('home features the latest post in a window with a drop cap and a divider', () => {
  const home = read('src/pages/index.astro');
  assert.match(home, /class="release window"/);
  assert.match(home, /class="release-description dropcap"/);
  assert.match(home, /<div class="divider" aria-hidden="true"><i class="gem"><\/i><\/div>/);
  assert.match(home, /class="archive-entry row-hover"/);
});

test('code blocks keep syntax colours but draw them from the amber CRT palette', () => {
  assert.match(read('astro.config.mjs'), /shikiConfig: \{ theme: 'css-variables' \}/);
  const css = squash(base());
  assert.ok(css.includes('--astro-code-foreground:var(--code-ink)'));
  assert.ok(css.includes('--astro-code-background:var(--code-bg)'));
});

test('keyboard focus on links survives forced colours', () => {
  const css = squash(base());
  const block = css.slice(css.indexOf('@media(forced-colors:active)'));
  assert.match(block, /a:focus-visible\{outline:2pxsolid;outline-offset:2px;?\}/);
});

test('the drop-cap paragraph contains its float', () => {
  assert.ok(squash(base()).includes('.dropcap,.content>p:first-child{display:flow-root;'));
});

test('page-only table styles stay out of the global stylesheet', () => {
  assert.doesNotMatch(base(), /table\.log|td\.date/);
  for (const page of ['src/pages/colophon.astro', 'src/pages/releases.astro']) assert.match(read(page), /table\.log td/, page);
});
