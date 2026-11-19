// The Grimoire palette: the single source of the site's colour tokens.
// Night is the dungeon screen, day is the rulebook page. Base.astro inlines
// themeCss() ahead of its global stylesheet; tests/theme.test.mjs checks every
// text pair against WCAG AA in both schemes.

const WM_RIM = '#2a1206';

export const PALETTE = Object.freeze({
  night: Object.freeze({
    bg: '#1c130c',
    panel: '#251910',
    'panel-2': '#2f2015',
    ink: '#ead9b5',
    muted: '#a99070',
    link: '#f0c060',
    visited: '#e3a58f',
    'quote-ink': '#cdb894',
    rule: '#5a4129',
    frame: '#8a6238',
    gold: '#d6a94e',
    torch: '#e8893a',
    rubric: '#d65a40',
    shadow: '#0a0604',
    'badge-bg': '#2a1c12',
    'code-bg': '#0d0805',
    'code-ink': '#ffc966',
    ship: '#9fd17f',
    wip: '#f0b45c',
    'hi-bg': '#f0a03c',
    'hi-ink': '#1c130c',
    grain: '5%',
    glow: 'color-mix(in srgb, var(--torch) 42%, var(--panel))',
    'wm-1': '#fff3cc',
    'wm-2': '#ffd27a',
    'wm-3': '#f0a03c',
    'wm-4': '#cf6a22',
    'wm-5': '#8a300e',
    'wm-filter': `drop-shadow(1px 0 0 ${WM_RIM}) drop-shadow(-1px 0 0 ${WM_RIM}) drop-shadow(0 1px 0 ${WM_RIM}) drop-shadow(0 -1px 0 ${WM_RIM}) drop-shadow(3px 3px 0 #0a0604)`,
    'wm-initial': 'transparent',
  }),
  day: Object.freeze({
    bg: '#b99568',
    panel: '#c4a171',
    'panel-2': '#a8814f',
    ink: '#1e140b',
    muted: '#36250f',
    link: '#4e1704',
    visited: '#4d1838',
    'quote-ink': '#36250f',
    rule: '#6f5a3e',
    frame: '#6f5232',
    gold: '#3f2909',
    torch: '#4c2203',
    rubric: '#6b130a',
    shadow: '#8f6a42',
    'badge-bg': '#ccab7c',
    'code-bg': '#1e140b',
    'code-ink': '#f3cf8a',
    ship: '#1a3913',
    wip: '#4a2b02',
    'hi-bg': '#1e140b',
    'hi-ink': '#efd9ae',
    grain: '8%',
    glow: 'transparent',
    'wm-1': '#5e3c17',
    'wm-2': '#45290b',
    'wm-3': '#2e1b08',
    'wm-4': '#1e140b',
    'wm-5': '#1e140b',
    'wm-filter': 'drop-shadow(1px 1px 0 #dcc497)',
    'wm-initial': 'var(--rubric)',
  }),
});

const pairs = (min, list) => list.map((pair) => {
  const [fg, bg] = pair.split('/');
  return Object.freeze({ fg, bg, min });
});

export const TEXT_PAIRS = Object.freeze([
  ...pairs(4.5, [
    'ink/bg', 'ink/panel', 'muted/bg', 'muted/panel', 'link/bg', 'link/panel',
    'visited/bg', 'visited/panel', 'quote-ink/bg', 'gold/bg', 'gold/panel',
    'torch/bg', 'torch/panel', 'code-ink/code-bg', 'hi-ink/hi-bg', 'bg/gold',
    'ship/bg', 'ship/panel', 'wip/bg', 'wip/panel',
  ]),
  ...pairs(3, ['rubric/bg', 'rubric/panel']),
]);

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio between two #rrggbb colours. */
export function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

const tokens = (scheme) => Object.entries(scheme).map(([name, value]) => `--${name}:${value};`).join('');
const position = ({ x, y }) => `${x}% ${y}%`;

/** The :root token CSS: day on :root, night under the dark-scheme query. */
export function themeCss({ corridorNight, corridorDay, stripNight, stripDay, torches }) {
  const [left, right] = torches;
  return `:root{color-scheme:light dark;${tokens(PALETTE.day)}`
    + '--accent:var(--gold);--accent-2:var(--rubric);--hot:var(--torch);'
    + `--scene:url("${corridorDay}");--strip:url("${stripDay}");`
    + `--torch-l:${position(left)};--torch-r:${position(right)}}`
    + `@media (prefers-color-scheme: dark){:root{${tokens(PALETTE.night)}`
    + `--scene:url("${corridorNight}");--strip:url("${stripNight}")}}`;
}
