# Grimoire Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme tinksoft.com into "Grimoire": a deep-brown dungeon screen at night and an umber rulebook page by day, with a dithered torchlit corridor, a blackletter wordmark, pixel section plates, a serif reading face, readable link highlights everywhere, and a party-roster projects page.

**Architecture:** One palette module (`src/lib/theme.mjs`) is the single source of the color tokens. It emits the `:root` CSS, which `Base.astro` inlines ahead of its global stylesheet. A deterministic Node script renders the dither art into a committed module of `data:` URIs, so the art adds no request. Everything else is CSS in `Base.astro` plus small markup edits per page, and two self-hosted woff2 fonts.

**Tech Stack:** Astro 5 (static), plain CSS, Node ≥ 20 (`node:test`, `node:zlib`), Fontsource packages (OFL fonts, copied into `public/fonts/`).

**Spec:** `docs/superpowers/specs/2026-11-18-grimoire-theme-design.md`. Read it first. The approved visual reference is `E:\Projects\Tinksoft\.superpowers\brainstorm\1520-1795055551\content\deep-brown-v4.html`; the post page and roster are in `deep-brown-v2.html` in the same folder. Use absolute paths, because that folder is git-ignored and won't exist in a worktree.

**Branch:** Work on `feat/grimoire-theme`, never on `main`. `main` has unrelated uncommitted files (`src/content/blog/week-note-2026-11-18.md`, `.gitignore`); leave them out of every commit.

## Global Constraints

- **Page budget:** every HTML page ≤ 14,336 bytes gzipped (`scripts/size-gate.mjs`). The expected heaviest after this work is about 12.1 KB.
- **No JavaScript:** 0 KB of JS and no executable `<script>`. Only `application/ld+json` is allowed.
- **CSP meta, exactly:** `default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'`.
- **One `<h1>` per page.** The wordmark is a link, never an `<h1>`.
- **Contrast:** WCAG AA, 4.5:1 for text and 3:1 for large text, in both schemes.
- **No ornament glyphs:** no Unicode fleurons (U+2766 ❦, U+2619 ☙, U+2767 ❧) anywhere in `src/`. The only ornament is the CSS pixel diamond.
- **Fonts:** Grenze Gotisch 700 (`public/fonts/grenze-gotisch-700.woff2`, ≤ 25,600 B) and Silkscreen 400 (`public/fonts/silkscreen-400.woff2`, ≤ 10,240 B). Both are OFL and ship with their license files. Use `font-display: swap`, and preload only Grenze, with `crossorigin`.
- **Fallback stacks:**
  - `--serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, "URW Palladio L", P052, Georgia, serif`
  - `--mono`: today's stack, `ui-monospace, "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", "Courier New", monospace`
  - `--f-display: "Grenze Gotisch", var(--serif)`
  - `--f-plate: "Silkscreen", var(--mono)`
- **Silkscreen is used only at 16px.** Never set blackletter in all caps.
- **Art:** opaque palette pixels or transparent ones, integer scale only, `image-rendering: pixelated`, no blur, no alpha blending.
- **Motion:** only the torch flicker moves, only at night, using `steps(1)` timing on 1.9 s and 2.3 s cycles. It's off under `prefers-reduced-motion: reduce`.
- **Copy:** no wording changes except:
  - plate labels lose their literal `[` `]`;
  - the wordmark replaces the ASCII logo;
  - README and colophon descriptions of the site are updated;
  - no fantasy "flavor" labels.
- **Day-mode `--panel-2`:** never behind text.
- **Tests:** run with `npm test` (`node --test`). The full gate is `npm run validate`.

## Review Focus

1. **Card-style links highlighted by hover or Tab.** A card's inner text (`.link-card` spans, `.tag-grid .count`, `.project-actions small`) must stay readable on the highlight fill. Pinned by the inherit-rule test in Task 4, and by the hover pass in Task 9.
2. **Fonts blocked or slow.** The wordmark and plates must still render legibly in the serif and mono fallbacks. Pinned by the fallback-stack test in Task 3; Task 5 checks it in the browser with fonts blocked.
3. **Windows high contrast (`forced-colors: active`).** The clipped-gradient wordmark must not vanish. Pinned by the forced-colors test in Task 5.
4. **A long post near the 14 KB limit.** The inline art must not grow unnoticed. Pinned by the inline-budget test in Task 2; Task 10 records the size report.
5. **A 375px-wide phone.** No horizontal page scroll. The masthead stacks, the corridor stays 240×160, and the roster turns into blocks under 30rem. Checked in the browser in Tasks 5 and 8.

---

### Task 1: Palette module with contrast tests

**Files:**
- Create: `src/lib/theme.mjs`
- Test: `tests/theme.test.mjs`

**Interfaces:**
- Produces:
  - `PALETTE: { day: Record<string, string>, night: Record<string, string> }`. Token name (no leading `--`) → CSS value. Both schemes have the same keys.
  - `TEXT_PAIRS: ReadonlyArray<{ fg: string, bg: string, min: number }>`, using token names.
  - `contrast(fg: string, bg: string): number`. WCAG ratio for two `#rrggbb` colors.
  - `themeCss(art: { corridorNight: string, corridorDay: string, stripNight: string, stripDay: string, torches: ReadonlyArray<{ x: number, y: number }> }): string`. Returns the CSS text.
- `themeCss` emits:
  - `:root{color-scheme:light dark;` plus every day token as `--name:value;`
  - the aliases `--accent:var(--gold);--accent-2:var(--rubric);--hot:var(--torch);`
  - `--scene:url("<corridorDay>");--strip:url("<stripDay>");--torch-l:<x>% <y>%;--torch-r:<x>% <y>%}`
  - then `@media (prefers-color-scheme: dark){:root{` + every night token + `--scene:url("<corridorNight>");--strip:url("<stripNight>")}}`

**Token values.** These are the spec's palette table. Notes:
- Day `ship` is `#1a3913`, not the spec's `#1d3d16`, which measures 4.37:1 on day `--bg`. Note this deviation in the commit message.
- `grain`, `glow` and the `wm-*` tokens come from the spec's Textures and Components sections.

| token | night | day |
|---|---|---|
| bg | `#1c130c` | `#b99568` |
| panel | `#251910` | `#c4a171` |
| panel-2 | `#2f2015` | `#a8814f` |
| ink | `#ead9b5` | `#1e140b` |
| muted | `#a99070` | `#36250f` |
| link | `#f0c060` | `#4e1704` |
| visited | `#e3a58f` | `#4d1838` |
| quote-ink | `#cdb894` | `#36250f` |
| rule | `#5a4129` | `#6f5a3e` |
| frame | `#8a6238` | `#6f5232` |
| gold | `#d6a94e` | `#3f2909` |
| torch | `#e8893a` | `#4c2203` |
| rubric | `#d65a40` | `#6b130a` |
| shadow | `#0a0604` | `#8f6a42` |
| badge-bg | `#2a1c12` | `#ccab7c` |
| code-bg | `#0d0805` | `#1e140b` |
| code-ink | `#ffc966` | `#f3cf8a` |
| ship | `#9fd17f` | `#1a3913` |
| wip | `#f0b45c` | `#4a2b02` |
| hi-bg | `#f0a03c` | `#1e140b` |
| hi-ink | `#1c130c` | `#efd9ae` |
| grain | `5%` | `8%` |
| glow | `color-mix(in srgb, var(--torch) 42%, var(--panel))` | `transparent` |
| wm-1 … wm-5 | `#fff3cc` `#ffd27a` `#f0a03c` `#cf6a22` `#8a300e` | `#5e3c17` `#45290b` `#2e1b08` `#1e140b` `#1e140b` |
| wm-filter | `drop-shadow(1px 0 0 #2a1206) drop-shadow(-1px 0 0 #2a1206) drop-shadow(0 1px 0 #2a1206) drop-shadow(0 -1px 0 #2a1206) drop-shadow(3px 3px 0 #0a0604)` | `drop-shadow(1px 1px 0 #dcc497)` |
| wm-initial | `transparent` | `var(--rubric)` |

`TEXT_PAIRS`:
- min 4.5: `ink/bg`, `ink/panel`, `muted/bg`, `muted/panel`, `link/bg`, `link/panel`, `visited/bg`, `visited/panel`, `quote-ink/bg`, `gold/bg`, `gold/panel`, `torch/bg`, `torch/panel`, `code-ink/code-bg`, `hi-ink/hi-bg`, `bg/gold`, `ship/bg`, `ship/panel`, `wip/bg`, `wip/panel`
- min 3: `rubric/bg`, `rubric/panel`

- [ ] **Step 1: Write the failing tests** in `tests/theme.test.mjs`

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { PALETTE, TEXT_PAIRS, contrast, themeCss } from '../src/lib/theme.mjs';

const art = {
  corridorNight: 'data:image/png;base64,N', corridorDay: 'data:image/png;base64,D',
  stripNight: 'data:image/png;base64,SN', stripDay: 'data:image/png;base64,SD',
  torches: [{ x: 26.3, y: 43.1 }, { x: 74.6, y: 43.1 }],
};

test('contrast matches WCAG reference values', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contrast('#ffffff', '#ffffff').toFixed(2), '1.00');
  assert.equal(contrast('#ffffff', '#000000').toFixed(2), '21.00');
});

test('both schemes define the same tokens', () => {
  assert.deepEqual(Object.keys(PALETTE.day).sort(), Object.keys(PALETTE.night).sort());
});

test('spec values are pinned', () => {
  assert.equal(PALETTE.night.bg, '#1c130c');
  assert.equal(PALETTE.day.bg, '#b99568');
  assert.equal(PALETTE.night['hi-bg'], '#f0a03c');
  assert.equal(PALETTE.day['hi-ink'], '#efd9ae');
  assert.equal(PALETTE.day.ship, '#1a3913');
});

for (const scheme of ['day', 'night']) {
  for (const { fg, bg, min } of TEXT_PAIRS) {
    test(`${scheme}: ${fg} on ${bg} is at least ${min}:1`, () => {
      const ratio = contrast(PALETTE[scheme][fg], PALETTE[scheme][bg]);
      assert.ok(ratio >= min, `${PALETTE[scheme][fg]} on ${PALETTE[scheme][bg]} is ${ratio.toFixed(2)}:1`);
    });
  }
}

test('themeCss puts day tokens on :root and night tokens under the dark query', () => {
  const css = themeCss(art);
  const [day, night] = css.split('@media (prefers-color-scheme: dark)');
  assert.ok(night, 'dark media query present');
  assert.match(day, /--bg:#b99568;/);
  assert.match(night, /--bg:#1c130c;/);
  assert.match(day, /--scene:url\("data:image\/png;base64,D"\)/);
  assert.match(night, /--scene:url\("data:image\/png;base64,N"\)/);
  assert.match(day, /--accent:var\(--gold\);--accent-2:var\(--rubric\);--hot:var\(--torch\);/);
  assert.match(day, /--torch-l:26\.3% 43\.1%;--torch-r:74\.6% 43\.1%/);
  assert.doesNotMatch(css, /undefined|NaN/);
});
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/theme.test.mjs`. Expected: FAIL with `Cannot find module '…/src/lib/theme.mjs'`.

- [ ] **Step 3: Implement `src/lib/theme.mjs`** with the exports above and the table values. `contrast` uses WCAG relative luminance (sRGB channel → `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4`; `L = .2126R + .7152G + .0722B`; ratio `(Lhi+.05)/(Llo+.05)`). `themeCss` output is minified as in the Interfaces block.

- [ ] **Step 4: Run the tests and check they pass.** Run `node --test tests/theme.test.mjs`. Expected: all pass, including 44 contrast cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.mjs tests/theme.test.mjs
git commit -m "Add the Grimoire palette module with WCAG contrast tests" -m "Day 'ship' is #1a3913 (spec's #1d3d16 measured 4.37:1 on day bg)."
```

---

### Task 2: Dither art generator and committed art module

**Files:**
- Create: `scripts/dither-art.mjs`
- Create (generated, committed): `src/generated/dither-art.mjs`
- Test: `tests/dither-art.test.mjs`

**Interfaces:**
- Produces, from `scripts/dither-art.mjs`. Importing it has no side effects; it only writes when run as a script.
  - `renderArt(): { corridorNight: Buffer, corridorDay: Buffer, stripNight: Buffer, stripDay: Buffer, torches: Array<{ x: number, y: number }> }`
  - `artModuleSource(art: ReturnType<typeof renderArt>): string`. ES-module source for `src/generated/dither-art.mjs`, with a header comment saying it's generated by `node scripts/dither-art.mjs`.
  - Running `node scripts/dither-art.mjs` writes `src/generated/dither-art.mjs`.
- Produces, from `src/generated/dither-art.mjs`:
  - `ART: { corridorNight: string, corridorDay: string, stripNight: string, stripDay: string }`. Each is `data:image/png;base64,…`.
  - `TORCHES: ReadonlyArray<{ x: number, y: number }>`
- Consumed by: Task 4 (`themeCss({ ...ART, torches: TORCHES })`).

**Port source:** `E:\Projects\Tinksoft\.superpowers\brainstorm\1520-1795055551\content\gen-corridor.cjs`. Port to ESM and keep its constants exactly:
- scene: `W=120`, `H=80`, `CX=W/2`, `CY=H/2+2`, `F=W/2`, `HH=0.8`, `ZF=4.4`
- torches `[±0.84, 0.14, 1.75]`
- lighting: ambient `0.06*exp(-(Z-1)*0.42)`, torch term `1.5*lam/(1+4.2*d²)`
- `NIGHT` (8 colors) and `DAY` (4 colors, index 0 transparent via `tRNS`) palettes
- 16×14 strips with stops `#ffc66b #f0a03c #cf6d24 #8a3a14 #4d200e #2a170c #1c130c` (night) and `#1e140b #3b2614 #5e3d1f #7e5a33 #9c7a4e #b99568` (day)

Drop the 4-color night variant and the preview output.

**Torch positions:** `x = (sx + 0.5) / W * 100` and `y = (sy - 3 + 0.5) / H * 100`, rounded to one decimal, where `(sx, sy)` is the torch's screen position as computed by the mockup's `torchSprites()`. Use `Number(v.toFixed(1))`.

- [ ] **Step 1: Write the failing tests** in `tests/dither-art.test.mjs`

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { artModuleSource, renderArt } from '../scripts/dither-art.mjs';
import { ART, TORCHES } from '../src/generated/dither-art.mjs';

const KEYS = ['corridorNight', 'corridorDay', 'stripNight', 'stripDay'];
const SIZES = { corridorNight: [120, 80], corridorDay: [120, 80], stripNight: [16, 14], stripDay: [16, 14] };
const CEILINGS = { corridorNight: 2048, corridorDay: 1536, stripNight: 256, stripDay: 256 };
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('renderArt is deterministic', () => {
  const a = renderArt(), b = renderArt();
  for (const key of KEYS) assert.ok(a[key].equals(b[key]), key);
  assert.deepEqual(a.torches, b.torches);
});

test('each image is a PNG of the expected size, under its byte ceiling', () => {
  const art = renderArt();
  for (const key of KEYS) {
    const png = art[key];
    assert.ok(png.subarray(0, 8).equals(PNG), `${key} signature`);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], SIZES[key], `${key} dimensions`);
    assert.ok(png.length <= CEILINGS[key], `${key} is ${png.length} B`);
  }
});

test('torches sit where the flicker CSS expects them', () => {
  assert.deepEqual(renderArt().torches, [{ x: 26.3, y: 43.1 }, { x: 74.6, y: 43.1 }]);
});

test('the committed module matches the generator', () => {
  const art = renderArt();
  for (const key of KEYS) assert.equal(ART[key], `data:image/png;base64,${art[key].toString('base64')}`, key);
  assert.deepEqual(TORCHES, art.torches);
  assert.match(artModuleSource(art), /generated by node scripts\/dither-art\.mjs/);
});

test('inline art stays inside its share of the page budget', () => {
  const total = KEYS.reduce((sum, key) => sum + ART[key].length, 0);
  assert.ok(total <= 5000, `inline art is ${total} characters`);
});
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/dither-art.test.mjs`. Expected: FAIL with `Cannot find module '…/scripts/dither-art.mjs'`.

- [ ] **Step 3: Implement `scripts/dither-art.mjs`** as a port of the mockup generator with the Interfaces above. Use `node:zlib` only, with no dependencies. Guard the write with `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)`.

- [ ] **Step 4: Generate the module.** Run `node scripts/dither-art.mjs`. Expected: `src/generated/dither-art.mjs` exists.

- [ ] **Step 5: Run the tests and check they pass.** Run `node --test tests/dither-art.test.mjs`. Expected: all 5 pass. If the torch test fails, compare against the mockup's `torchSprites()`; don't edit the expected values.

- [ ] **Step 6: Eyeball the art.** Write the four PNGs to a temporary folder outside the repo and open them. The night corridor must look like `scene-4x` from the brainstorm: torchlit stone walls, a dark arched doorway at the far end, flames on both walls.

- [ ] **Step 7: Commit**

```bash
git add scripts/dither-art.mjs src/generated/dither-art.mjs tests/dither-art.test.mjs
git commit -m "Add the deterministic dither art generator and its committed corridor art"
```

---

### Task 3: Self-hosted fonts, font CSP and loading

**Files:**
- Create: `public/fonts/grenze-gotisch-700.woff2`, `public/fonts/silkscreen-400.woff2`, `public/fonts/LICENSE-grenze-gotisch.txt`, `public/fonts/LICENSE-silkscreen.txt`, `public/fonts/SOURCE.txt`
- Modify: `package.json` (devDependencies), `package-lock.json`
- Modify: `src/layouts/Base.astro`: CSP meta (line 100), a new preload `<link>` after it, and `@font-face` rules plus the type variables at the top of the global `<style>`
- Test: `tests/theme-source.test.mjs` (new; later tasks append to it)

**Interfaces:**
- Produces CSS custom properties on `:root`, declared in the global style: `--serif`, `--mono`, `--f-display`, `--f-plate` (values in Global Constraints).
- Produces font families `"Grenze Gotisch"` (weight 700) and `"Silkscreen"` (weight 400).

- [ ] **Step 1: Write the failing tests** in `tests/theme-source.test.mjs`

```js
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
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/theme-source.test.mjs`. Expected: FAIL. The font file is missing and the CSP assertion fails.

- [ ] **Step 3: Install the font sources.** Run `npm install --save-dev --save-exact @fontsource/grenze-gotisch @fontsource/silkscreen`. Expected: both appear in `devDependencies`.

- [ ] **Step 4: Copy the files.** List the Latin files with `ls node_modules/@fontsource/grenze-gotisch/files | grep latin-700-normal.woff2` (and the same for Silkscreen with `latin-400-normal.woff2`). Copy them to the target names. Copy each package's `LICENSE` to the matching `LICENSE-*.txt`. Write `SOURCE.txt` with each package name and exact version and the original file names.
  - If Grenze is over 25,600 B, subset it: `pyftsubset <file> --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026" --flavor=woff2 --output-file=public/fonts/grenze-gotisch-700.woff2`. Record that in `SOURCE.txt`.

- [ ] **Step 5: Edit `Base.astro`.**
  - Set the CSP meta to the exact Global Constraints value.
  - Add the preload `<link>` exactly as the test expects.
  - At the top of the global style, add `@font-face` for both faces, each with `src: url('/fonts/<file>') format('woff2')` and `font-display: swap`, plus `font-synthesis: none` on Grenze.
  - Declare `--serif`, `--mono`, `--f-display` and `--f-plate` on `:root`.
  - Switch `body`'s `font-family` to `var(--mono)`.

- [ ] **Step 6: Run the tests and check they pass.** Run `node --test tests/theme-source.test.mjs`. Expected: 4 pass.

- [ ] **Step 7: Run the full gate.** Run `npm run validate`. Expected: exit 0. The validator resolves the preload `href` to `dist/fonts/grenze-gotisch-700.woff2`.

- [ ] **Step 8: Commit**

```bash
git add public/fonts package.json package-lock.json src/layouts/Base.astro tests/theme-source.test.mjs
git commit -m "Self-host Grenze Gotisch and Silkscreen and allow them in the CSP"
```

---

### Task 4: Site-wide palette, type roles, highlights, grain, strip and icons

**Files:**
- Modify: `src/layouts/Base.astro`:
  - frontmatter: import `themeCss` and `ART`/`TORCHES`; replace the favicon constant (line 85);
  - head: the `theme-color` metas (lines 101–102); inject the theme CSS before the global `<style>`;
  - global style: delete both `:root` token blocks (lines 116–160); restyle `html`, `body`, `body::before`, links, `::selection`, focus, `h1`–`h3`.
- Modify: `public/favicon.svg`, `public/counter.svg`, `public/badge.svg`
- Test: `tests/theme-source.test.mjs` (append)

**Interfaces:**
- Consumes:
  - `themeCss(art)` from Task 1;
  - `ART` and `TORCHES` from Task 2, injected as `<Fragment set:html={`<style>${themeCss({ ...ART, torches: TORCHES })}</style>`} />`;
  - `--serif`, `--mono` and `--f-display` from Task 3.
- Produces site-wide behavior that later tasks rely on:
  - every token in `PALETTE`, plus `--scene`, `--strip`, `--torch-l` and `--torch-r`;
  - the highlight rule;
  - `h1` set in `var(--f-display)` with a `--rubric` first letter.

**What to change:**
- **Background:** `html` and `body` use `--bg` with the grain checker, `repeating-conic-gradient(color-mix(in srgb, var(--ink) var(--grain), transparent) 0 25%, transparent 0 50%) 0 0 / 4px 4px`.
- **Top strip:** `body::before` becomes 28px tall, `background: var(--strip) 0 0 / 32px 28px repeat-x; image-rendering: pixelated`.
- **Links:** use `--link`, with visited in `--visited`.
- **Highlight:** add this block verbatim, including the comment:

```css
/* The site's one deliberate !important: page-scoped link colours must never beat the highlight. */
a:hover, a:focus-visible { color: var(--hi-ink) !important; background-color: var(--hi-bg) !important; text-decoration: none; box-shadow: 0 0 0 2px var(--hi-bg); outline: none; }
a:focus-visible { box-shadow: 0 0 0 2px var(--hi-bg), 0 0 0 4px var(--hi-ink); }
a:is(:hover, :focus-visible) * { color: inherit !important; }
```

- **Selection, nav and focus:**
  - `::selection` uses `--hi-bg`/`--hi-ink`;
  - `nav.site a[aria-current='page']` uses `--hi-bg`/`--hi-ink`, bold, with `box-shadow: 0 0 0 2px var(--hi-bg)`;
  - non-link `:focus-visible` gets a 2px `--torch` outline;
  - `nav.thread::before` (`PATH ::`) is set in `--torch`.
- **Headings:**
  - `h1` is `700` in `var(--f-display)`, `clamp(36px, 7vw, 54px)/1.02`, with `h1::first-letter { color: var(--rubric) }`;
  - `h3` is bold `var(--serif)` in `--torch`.
- **Icons:**
  - The favicon (data URI and `public/favicon.svg`) becomes the 5×5 pixel diamond: `--gold` edges, `--torch` core, on `#1c130c`. In light scheme it sits on `#b99568` with a `#6b130a` core.
  - `counter.svg` becomes `#ffc966` text on `#0d0805` with a `#5a4129` stroke, the same in both schemes.
  - `badge.svg` becomes `#1c130c` with a `#d6a94e` double frame and `#e8893a` text, still monospace.
  - The `theme-color` metas become `#b99568` (light) and `#1c130c` (dark).

- [ ] **Step 1: Append the failing tests** to `tests/theme-source.test.mjs`

```js
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/theme-source.test.mjs`. Expected: the 4 new tests FAIL. Retired hexes are found in `Base.astro` and the SVGs.

- [ ] **Step 3: Implement the changes** listed under What to change.

- [ ] **Step 4: Run the tests and check they pass.** Run `npm test`. Expected: all pass.

- [ ] **Step 5: Check it in the browser.**
  - Start the dev server: `npm run dev`, port 4321.
  - In both color schemes (emulate light and dark), check:
    - home, archive and tags show the brown palette and grain, with the dithered strip on top;
    - hovering and Tab-focusing links shows readable highlight fills: the archive page's `.tags a`, the home page's `[.txt]`, and the tags index cards (including `.count`);
    - `h1` is blackletter with a red initial.

- [ ] **Step 6: Run the full gate.** Run `npm run validate`. Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/Base.astro public/favicon.svg public/counter.svg public/badge.svg tests/theme-source.test.mjs
git commit -m "Retheme tokens, type roles, link highlights and icons to Grimoire"
```

---

### Task 5: Masthead with corridor viewport, wordmark and torch flicker

**Files:**
- Modify: `src/layouts/Base.astro`: header markup (lines 402–418) and the masthead, telemetry and mobile CSS (today's `.masthead`, `pre.ascii`, `a.logo`, `.tagline`, `.telemetry` rules and the 48rem block)
- Test: `tests/theme-source.test.mjs` (append)

**Interfaces:**
- Consumes `--scene`, `--torch-l`, `--torch-r` and the `wm-*` and `glow` tokens (Task 4), and `--f-display` (Task 3).
- Produces this markup inside `.masthead`, which later tasks don't touch:

```html
<div class="viewport" aria-hidden="true"></div>
<div class="titleblock">
  <span class="wordmark-glow">
    <a class="wordmark" href="/"><span class="ini">T</span>inkSoft</a>
    <span class="title-rule" aria-hidden="true"></span>
  </span>
  <p class="tagline">software, security, games, and whatever else interests me.</p>
</div>
<dl class="telemetry" aria-label="site telemetry">…unchanged…</dl>
```

**Values, from the spec's Masthead section:**
- **`.masthead`:** grid `auto minmax(0,1fr) auto`, gap 26px; `border: 6px ridge var(--frame)`; four corner rivets made of `radial-gradient(circle, var(--gold) 0 2px, var(--shadow) 2px 3px, transparent 3.5px)` layers, 10px each, placed 3px in from each corner; `box-shadow: 4px 4px 0 var(--shadow)`.
- **`.viewport`:** 240×160, `background: var(--scene) 0 0 / 240px 160px no-repeat, var(--panel-2)`, pixelated, `border: 3px double var(--gold)`, `box-shadow: 0 0 0 2px var(--shadow)`.
- **Flicker:**
  - `::before` and `::after` are halos: sparse `repeating-conic-gradient(#ffc66b 0 25%, transparent 0 100%) 0 0 / 4px 4px`, masked by `radial-gradient(circle at var(--torch-l|r), #000 0 var(--r), transparent var(--r))`.
  - `@property --r` is registered as a `<percentage>`.
  - `@keyframes flicker` steps `--r` through 9%, 11%, 8%, 10%, 7.5% and opacity through .5, .62, .42, .58, .45, at 0/18/34/52/77%.
  - The cycles are 1.9 s and 2.3 s (delay −.7 s), with `steps(1)`.
  - The halos are hidden in light scheme, and the animation is set to `none` under reduced motion.
- **`.wordmark` (including `:hover` and `:focus-visible`):**
  - `font: 700 clamp(48px, 6.6vw, 84px)/.98 var(--f-display)`.
  - The background is five bands, `linear-gradient(180deg, var(--wm-1) 0 28%, var(--wm-2) 28% 46%, var(--wm-3) 46% 64%, var(--wm-4) 64% 81%, var(--wm-5) 81%)`, under four checker rows: `repeating-conic-gradient(var(--wm-N) 0 25%, transparent 0 50%) 0 P% / 4px 4px repeat-x` at P = 27, 45, 63, 80 for N = 2, 3, 4, 5.
  - `background-clip: text`, `-webkit-text-fill-color: transparent`, `filter: var(--wm-filter)`, `box-shadow: none`.
  - `.ini` gets `-webkit-text-fill-color: var(--wm-initial)`.
  - Hover: `filter: var(--wm-filter) brightness(1.15) saturate(1.1)`.
  - Focus: `outline: 2px dashed var(--torch); outline-offset: 6px`.
- **`.wordmark-glow`:**
  - `position: relative; isolation: isolate; display: inline-block`.
  - `::before` is the outer glow: `conic-gradient(at 2px 2px, transparent 75%, var(--glow) 0) 0 0 / 6px 6px`, masked by a 50%×50% ellipse.
  - `::after` is the inner glow: `repeating-conic-gradient(var(--glow) 0 25%, transparent 0 100%) 0 0 / 4px 4px`, masked by a 34%×30% ellipse.
  - Both have `inset: -16px -36px -12px -30px` and `z-index: -1`, and hard mask edges (`#000 99%, transparent 100%`).
- **`.title-rule`:**
  - `display: block; height: 4px; margin: 4px 0 8px`, width 100% of the wrapper, so it's exactly as wide as the wordmark.
  - It's a 2px `--gold` line at y=1px, ending 24px early.
  - The last 24px are 16px of `repeating-conic-gradient(var(--gold) 0 25%, transparent 0 50%) 0 0/4px 4px` followed by 8px of the 25% version.
- **`.tagline`:** italic 15.5px `var(--serif)` in `--muted`, with the old `// ` prefix removed.
- **`.telemetry`:** `border-left: 3px double var(--rule)`, with `dd` in `--torch`.
- **Under 48rem:** one column, `justify-items: start`, telemetry hidden, the viewport stays 240×160.
- **Forced colors:** `@media (forced-colors: active) { .wordmark { -webkit-text-fill-color: currentColor; background: none; filter: none; } .wordmark-glow::before, .wordmark-glow::after { display: none; } }`

- [ ] **Step 1: Append the failing tests** to `tests/theme-source.test.mjs`

```js
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
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/theme-source.test.mjs`. Expected: the 3 new tests FAIL.

- [ ] **Step 3: Implement the markup and CSS** above. Delete the old `.masthead`, `pre.ascii`, `a.logo`, `a.logo:hover` and `.tagline` rules and the inline `style="text-decoration:none"`.

- [ ] **Step 4: Run the tests and check they pass.** Run `npm test`. Expected: all pass.

- [ ] **Step 5: Check it in the browser** at 1280px and 375px wide, in both schemes:
  - **Night:** the corridor has flickering halos on both flames; the wordmark is molten gold with dithered seams, a dark rim and a hard shadow; there's a dotted glow behind it.
  - **Day:** an ink-engraved corridor with no halos, and an ink-stamp wordmark with a red T.
  - The rule under the title ends with the wordmark's right edge.
  - Hovering the wordmark brightens it with **no orange box**. Tab-focusing it shows a dashed outline.
  - At 375px there's no horizontal scroll; the corridor is above the title.
  - Block `/fonts/*` in DevTools (Network → block request URL), reload, and confirm the serif fallback wordmark and mono plates still read cleanly.

- [ ] **Step 6: Run the full gate.** Run `npm run validate`. Expected: exit 0, with exactly one `<h1>` per page still.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/Base.astro tests/theme-source.test.mjs
git commit -m "Replace the ASCII logo with the corridor viewport and blackletter wordmark"
```

---

### Task 6: Shared components: plates, panels, diamonds, prose, footer

**Files:**
- Modify: `src/layouts/Base.astro`: global CSS for `.scene-panel`, `.scene-label`, `.eyebrow`, `.action`, `table.log`, `nav.post-nav`, `.content`, `hr`, footer; footer markup (lines 446–470)
- Modify, to drop literal brackets from plate labels and add `class="plate"` where a page styles its own section `h2`:
  - `src/pages/404.astro`
  - `src/pages/about.astro`
  - `src/pages/colophon.astro`
  - `src/pages/demo.astro`
  - `src/pages/index.astro`: the three `module-header h2`; delete their scoped `.module-header h2` rules
  - `src/pages/links.astro`
  - `src/pages/log/[...slug].astro`
  - `src/pages/now.astro`
  - `src/pages/projects/index.astro`: the two `panel-title h2`
  - `src/pages/projects/[...slug].astro`: the two `section-bar h2`
  - `src/pages/releases.astro`
- Test: `tests/theme-source.test.mjs` (append)

**Interfaces:**
- Produces these global classes for Tasks 7–9:
  - `.plate`: the section label. `.scene-label` gets the same look and keeps its position, cut into the panel's top border.
  - `.window`: a featured panel with a 3px double `--gold` frame.
  - `.gem` and `.gem.sm`: the pixel diamond.
  - `.divider`: a dithered rule, then one `.gem`, then a dithered rule.
  - `.dropcap`: the illuminated first letter.
  - `.row-hover`: the list-row hover treatment.
  - `.content > p:first-child` gets the drop cap automatically.

**Values, from the spec's Components section:**
- **`.plate`:**
  - `--gold` fill, `--bg` text, `400 16px/1.3 var(--f-plate)`, uppercase, `padding: 3px 12px 2px`.
  - The right tail: `::after` is a 16px strip of `repeating-conic-gradient(var(--gold) 0 25%, transparent 0 50%) 0 0/4px 4px`, then `::before` is a 12px strip of the 25% version.
- **Panels:** `.scene-panel`, the footer grid and `nav.post-nav p` get `3px double var(--rule)`, `--panel` and `4px 4px 0 var(--shadow)`.
- **`.window`:** the same, with `--gold` as the frame color.
- **`.action`:** background `--panel`, not `--panel-2`, because day `--panel-2` can't carry text.
- **`.gem`:**
  - `--p: 3px` (`.sm`: `2px`); the element is one `--p` square in `--torch` (`--rubric` in light scheme).
  - Eleven `box-shadow` pixels in `--gold` at offsets, in units of `--p`:
    - (0,−2)
    - (−1,−1), (0,−1), (1,−1)
    - (−2,0), (−1,0), (1,0), (2,0)
    - (−1,1), (0,1), (1,1)
    - (0,2)
  - `margin: calc(var(--p)*2) calc(var(--p)*2.5)`.
- **`.divider`:** flex with a 12px gap; `::before` and `::after` are 4px gold checker rules.
- **Footer:** replace `.footer-rule` with `<div class="divider" aria-hidden="true"><i class="gem sm"></i><i class="gem"></i><i class="gem sm"></i></div>`. Badges stay mono. The counter `img` gets a `--rule` border.
- **`.dropcap::first-letter` (and the `.content` first paragraph):**
  - `float: left; margin: 4px 10px 0 0; padding: 4px 8px 2px; font: 700 3.1em/.9 var(--f-display); color: var(--rubric)`;
  - `border: 1px solid var(--gold); box-shadow: 2px 2px 0 var(--shadow)`;
  - `background: var(--bg) repeating-conic-gradient(color-mix(in srgb, var(--gold) 30%, transparent) 0 25%, transparent 0 50%) 0 0/4px 4px`.
- **Prose (`.content`):**
  - `17.5px/1.62 var(--serif)`.
  - `h2`: `700 1.55em/1.1 var(--f-display)`. `main > h2:not(.plate, .scene-label)::before` and `.content > h2::before` are a `.gem`-style diamond drawn on the pseudo-element; this replaces `'// '`.
  - `strong` in `--torch`.
  - Inline `code` in `--code-ink` on `--code-bg`.
  - `pre`: `--code-ink` with `text-shadow: 0 0 6px color-mix(in srgb, var(--code-ink) 35%, transparent)`, a `1px solid var(--frame)` border and a `3px 3px 0 var(--shadow)` shadow.
  - `blockquote`: `4px solid var(--rubric)` left rule, italic, `--quote-ink`.
  - `hr`: a 4px gold checker, no border.
- **`table.log` rows and `.row-hover`:** on hover, `background: color-mix(in srgb, var(--panel) 70%, transparent); box-shadow: inset 3px 0 0 var(--torch)`. Titles in bold `var(--serif)`.

- [ ] **Step 1: Append the failing tests** to `tests/theme-source.test.mjs`

```js
const FLEURONS = /[\u2766\u2619\u2767]/;

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
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/theme-source.test.mjs`. Expected: the bracket test lists the ~30 plate labels, and the other 3 fail.

- [ ] **Step 3: Implement the global CSS and the footer markup.**

- [ ] **Step 4: Edit each listed page.** Drop the `[` `]` from plate-label text, for example `[LATEST DROP]` becomes `LATEST DROP` and `[01 // RASTER]` becomes `01 // RASTER`. Add `class="plate"` to the module, panel-title and section-bar `h2`s, and delete their now-duplicate scoped styles. Leave `.eyebrow` and `.footer-heading` brackets alone.

- [ ] **Step 5: Run the tests and check they pass.** Run `npm test`. Expected: all pass.

- [ ] **Step 6: Check it in the browser.** Look at about, colophon, now and the post page in both schemes:
  - plates sit cleanly on panel borders;
  - diamonds are crisp, with no blur;
  - the footer shows three diamonds.

- [ ] **Step 7: Run the full gate.** Run `npm run validate`. Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/layouts/Base.astro src/pages tests/theme-source.test.mjs
git commit -m "Add Grimoire plates, panels, pixel diamonds and prose styles"
```

---

### Task 7: Home and post pages

**Files:**
- Modify: `src/pages/index.astro`: markup and scoped styles for `.index-header`, `.release`, `.archive-*`
- Modify: `src/pages/log/[...slug].astro`: `.post-head`, `.dek`, `.post-facts`, `.tag-row`, `.contents`, `.connections`, `.post-nav`
- Test: `tests/theme-source.test.mjs` (append)

**Interfaces:**
- Consumes `.window`, `.dropcap`, `.divider`, `.gem` and `.row-hover` (Task 6).

**Changes:**
- **Home:**
  - `.release` gets the `window` class; `.release-description` gets `dropcap`; the release `h3` becomes `700 21px/1.2 var(--serif)`.
  - Insert `<div class="divider" aria-hidden="true"><i class="gem"></i></div>` between the latest and archive modules.
  - Archive entries get `row-hover`. Titles become 18px bold serif, numbers `--torch` mono, descriptions 15.5px serif `--muted`.
  - `.lede` becomes 17.5px serif.
  - Delete the scoped `.release::after` decoration and any scoped colour rules that duplicate global ones.
- **Post:**
  - `h1` is about 44px, which is 0.82 of the display size. Use `clamp(32px, 6vw, 44px)`.
  - `.dek` becomes 17.5px italic serif `--muted`.
  - `.post-facts` and `.tag-row` stay mono; tag chips use `--panel-2` with `--ink` text **at night only**, and `--panel` by day.
  - `.contents` and `.connections` are ordinary panels; `connections` `h3` and links are serif.

- [ ] **Step 1: Append the failing tests**

```js
test('home features the latest post in a window with a drop cap and a divider', () => {
  const home = read('src/pages/index.astro');
  assert.match(home, /class="release window"/);
  assert.match(home, /class="release-description dropcap"/);
  assert.match(home, /<div class="divider" aria-hidden="true"><i class="gem"><\/i><\/div>/);
  assert.match(home, /class="archive-entry row-hover"/);
});
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/theme-source.test.mjs`. Expected: FAIL on `class="release window"`.

- [ ] **Step 3: Implement the home and post changes.**

- [ ] **Step 4: Run the tests and check they pass.** Run `npm test`. Expected: all pass.

- [ ] **Step 5: Check it in the browser.** Compare `/` with the approved mockup (`deep-brown-v4.html`) and a long post such as `/log/week-note-2026-11-07/` with `deep-brown-v2.html`'s post section, in both schemes. Check the drop cap on the first paragraph, diamond-prefixed blackletter `h2`s, the amber code block and the red-ruled quote.

- [ ] **Step 6: Run the full gate.** Run `npm run validate`. Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro "src/pages/log/[...slug].astro" tests/theme-source.test.mjs
git commit -m "Theme the home and post pages with windows, drop caps and dividers"
```

---

### Task 8: Projects page as the party roster

**Files:**
- Modify: `src/lib/content.mjs` (add `rosterRows`)
- Modify: `src/pages/projects/index.astro`: replace the `.project-grid` cards with the roster table; theme `.status-board`; move the `relatedPosts` and `lastUpdate` logic into `rosterRows`
- Test: `tests/content.test.mjs` (append)

**Interfaces:**
- Produces:

```ts
rosterRows(projects: Array<{ id: string, data: { title: string, description: string, status: 'wip'|'shipped'|'idea', started?: Date, repo?: string, link?: string, tag?: string } }>,
           posts: Array<{ data: { date: Date, tags: string[] } }>)
  => Array<{ number: number, id: string, title: string, description: string,
             status: 'wip'|'shipped'|'idea', code: string, name: string,
             since: string | null, notes: string, last: string | null,
             repo?: string, link?: string }>
```

- Behavior:
  - Sorted by `PROJECT_STATUS[status].order`, then newest `started` first, with a missing `started` sorting last within its state.
  - `number` is 1-based in that order.
  - `code` and `name` come from `PROJECT_STATUS`.
  - `since` is `YYYY-MM` from `started`, or `null`.
  - `notes` is the count of posts carrying the project's `tag`, padded to two digits (`'00'` when there's no tag).
  - `last` is `YYYY-MM-DD` of the newest such post, or else of `started`, or `null`.

- [ ] **Step 1: Append the failing tests** to `tests/content.test.mjs`

```js
import { rosterRows } from '../src/lib/content.mjs';

const project = (id, status, started, extra = {}) =>
  ({ id, data: { title: id, description: `${id} desc`, status, started: started && new Date(started), ...extra } });
const dated = (date, ...tags) => ({ data: { date: new Date(date), tags } });

test('rosterRows sorts by state then newest start and numbers from 1', () => {
  const rows = rosterRows([
    project('old-ship', 'shipped', '2025-07-15'),
    project('idea', 'idea', '2026-05-01'),
    project('new-wip', 'wip', '2026-06-09'),
    project('old-wip', 'wip', '2026-03-01'),
  ], []);
  assert.deepEqual(rows.map((r) => [r.number, r.id]), [[1, 'new-wip'], [2, 'old-wip'], [3, 'old-ship'], [4, 'idea']]);
  assert.deepEqual([rows[0].code, rows[0].name], ['RUN', 'active']);
});

test('rosterRows derives since, notes and last from tagged posts', () => {
  const [row] = rosterRows(
    [project('site', 'wip', '2026-06-09', { tag: 'meta', repo: 'https://github.com/x/site' })],
    [dated('2026-11-18', 'meta'), dated('2026-08-24', 'meta', 'other'), dated('2026-12-01', 'elsewhere')],
  );
  assert.equal(row.since, '2026-06');
  assert.equal(row.notes, '02');
  assert.equal(row.last, '2026-11-18');
  assert.equal(row.repo, 'https://github.com/x/site');
  assert.equal(row.link, undefined);
});

test('rosterRows handles projects without a tag or start date', () => {
  const [row] = rosterRows([project('bare', 'idea', undefined)], [dated('2026-11-18', 'meta')]);
  assert.equal(row.since, null);
  assert.equal(row.notes, '00');
  assert.equal(row.last, null);
});
```

- [ ] **Step 2: Run the tests and check they fail.** Run `node --test tests/content.test.mjs`. Expected: FAIL with `rosterRows is not a function`, or an import error.

- [ ] **Step 3: Implement `rosterRows`** in `src/lib/content.mjs`.

- [ ] **Step 4: Run the tests and check they pass.** Run `node --test tests/content.test.mjs`. Expected: all pass.

- [ ] **Step 5: Replace the card grid with the roster.**
  - **Structure:** one `<table class="roster window">` with a visually hidden `<caption>` reading `Release files`. The plate `h2` stays as the section heading. Headers are `<th scope="col">` for `#`, `NAME`, `STATE`, `SINCE`, `NOTES`, `LAST`, `FILES`.
  - **Cells:**
    - `NAME` holds the title as `<a href="/projects/{id}/">` (bold serif 15px), then `<span class="desc">` (serif `--muted` 14px), then `<span class="row-meta">since … · NN notes · last …</span>`, which is shown only under 30rem.
    - `STATE` is `<span class="status-ship|status-wip|status-idea">{code} · {name}</span>`.
    - `FILES` has `[<a>src</a>]` and `[<a>visit</a>]` only when present.
  - **Styling:**
    - header row: mono `--gold` uppercase with a 2px gold bottom rule;
    - body rows: dotted `--rule` separators, plus `row-hover`;
    - numbers and dates: tabular figures.
  - **Responsive:**
    - under 48rem, hide the `SINCE` and `LAST` columns;
    - under 30rem, display rows as blocks the way `table.log` does, hide the `SINCE`, `NOTES` and `LAST` cells, and show `.row-meta`.
  - **Keep:** the `[STATUS BOARD]` counts (now a plate and panel) and the `No project files.` empty state.

- [ ] **Step 6: Check it in the browser.** Open `/projects/` at 1280px, 700px and 375px, in both schemes:
  - every project shows its description and its src/visit links where they exist;
  - there's no horizontal scroll at 375px;
  - hovering a row tints it, and hovering a name shows the readable highlight.

- [ ] **Step 7: Run the full gate.** Run `npm run validate`. Expected: exit 0, with one `<h1>`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/content.mjs tests/content.test.mjs src/pages/projects/index.astro
git commit -m "Turn the projects index into a party roster that keeps every card field"
```

---

### Task 9: Sweep the remaining pages

**Files:**
- Modify only where a page's own styles fight the theme:
  - `src/pages/archive.astro`
  - `src/pages/tags/index.astro`
  - `src/pages/tags/[tag].astro`
  - `src/pages/now.astro`
  - `src/pages/about.astro`
  - `src/pages/links.astro`
  - `src/pages/releases.astro`
  - `src/pages/colophon.astro`
  - `src/pages/404.astro`
  - `src/pages/demo.astro`
  - `src/pages/projects/[...slug].astro`

**What "fights the theme" means:**
- a scoped rule that sets a link's or a link-child's color *on hover* (delete it; the global inherit rule handles it);
- titles still in mono where the spec says serif (list and card titles), or ledes and deks still in mono where the spec says 17.5px serif `--muted`;
- tag chips on day `--panel-2` (use `--panel`);
- hard-coded spacing that breaks the plate-on-border position.

Project and post bodies get the drop cap through `.content > p:first-child`. Demo parts keep their animations and pause toggle.

- [ ] **Step 1: Check the build.** Run `npm run build`. Expected: exit 0.

- [ ] **Step 2: Hover and Tab through every listed page** in both schemes on the dev server. On each block link (`.link-card`, `.tag-grid a`, `.project-actions a`, `.card-actions a`, post-nav, `.tag-row a`), every piece of text inside the highlight must be readable. Write down each failure as page and selector.

- [ ] **Step 3: Fix each failure** in the page's scoped styles. Delete the offending scoped hover rules; don't add new `!important`s.

- [ ] **Step 4: Check the demo page.** The raster bars, plasma and scroller must still read as three distinct effects in both schemes, and the pause toggle must still stop them.

- [ ] **Step 5: Run the full gate.** Run `npm run validate`. Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages
git commit -m "Sweep the remaining pages for Grimoire type, chips and readable highlights"
```

---

### Task 10: Docs, budget record and accessibility review

**Files:**
- Modify: `README.md`:
  - line 10: still 2 requests per page (document + `counter.svg`), plus two cached font files on a first visit; art and CSS are inlined;
  - add a numbers bullet for the fonts;
  - add `scripts/dither-art.mjs`, `src/lib/theme.mjs` and `public/fonts/` to the Map.
- Modify: `src/pages/colophon.astro`: line 34's requests row to match the README, and lines 57–58 to "titles and reading text use a system old-style serif, headings use self-hosted Grenze Gotisch, section plates use Silkscreen, and the terminal chrome stays monospace".
- Modify: `src/content/projects/tinksoft-site.md`, only if it describes the old look. Check with `grep -n -i "teal\|monospace\|ascii" src/content/projects/tinksoft-site.md`.
- Modify: `docs/accessibility-review.md`: add a dated 2026 Grimoire entry.

- [ ] **Step 1: Update the README, colophon and project copy** as listed.

- [ ] **Step 2: Run the full gate.** Run `npm run validate`. Expected: exit 0.

- [ ] **Step 3: Record the budget.** Run `head -12 dist/size-report.txt`. Expected: the heaviest page is under 14,336 B, and about 12.1 KB or less. If it's over 12.8 KB, stop and report before shipping, since the spec's escape hatches need the owner.

- [ ] **Step 4: Do the accessibility pass and write it up** in `docs/accessibility-review.md`. Cover:
  - keyboard Tab order and visible focus on every page;
  - every block link highlighted;
  - `prefers-reduced-motion` with no flicker;
  - forced colors with a visible wordmark (Chrome DevTools → Rendering → emulate `forced-colors: active`);
  - fonts blocked, with the fallbacks reading cleanly;
  - 375px width with no horizontal scroll;
  - contrast, by referencing `tests/theme.test.mjs`.

  Record anything that fails as an open item.

- [ ] **Step 5: Commit**

```bash
git add README.md src/pages/colophon.astro src/content/projects/tinksoft-site.md docs/accessibility-review.md
git commit -m "Document the Grimoire theme's numbers, fonts and accessibility review"
```
