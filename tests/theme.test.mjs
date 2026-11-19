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
