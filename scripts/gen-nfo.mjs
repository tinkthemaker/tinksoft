// One-shot generator for the scene-style .nfo file.
// Run: node scripts/gen-nfo.mjs
import { writeFileSync } from 'node:fs';

const WIDTH = 70;
const INNER = WIDTH - 4;

const logo = [
  '████████╗██╗███╗   ██╗██╗  ██╗███████╗ ██████╗ ███████╗████████╗',
  '╚══██╔══╝██║████╗  ██║██║ ██╔╝██╔════╝██╔═══██╗██╔════╝╚══██╔══╝',
  '   ██║   ██║██╔██╗ ██║█████╔╝ ███████╗██║   ██║█████╗     ██║',
  '   ██║   ██║██║╚██╗██║██╔═██╗ ╚════██║██║   ██║██╔══╝     ██║',
  '   ██║   ██║██║ ╚████║██║  ██╗███████║╚██████╔╝██║        ██║',
  '   ╚═╝   ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝        ╚═╝',
];

function framed(text = '', align = 'left') {
  if (text.length > INNER) {
    throw new Error(`NFO line is ${text.length} columns; maximum is ${INNER}: ${text}`);
  }

  const spare = INNER - text.length;
  const left = align === 'center' ? Math.floor(spare / 2) : 0;
  const right = spare - left;
  return `║ ${' '.repeat(left)}${text}${' '.repeat(right)} ║`;
}

function rule(left, right, label = '') {
  const heading = label ? `═[ ${label} ]` : '';
  return left + heading + '═'.repeat(WIDTH - 2 - heading.length) + right;
}

function section(label) {
  return rule('╠', '╣', label);
}

function field(label, value) {
  return framed(`  ${label.padEnd(14, '.')} : ${value}`);
}

function wrap(text, indent = 2) {
  const limit = INNER - indent;
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > limit && current) {
      lines.push(framed(' '.repeat(indent) + current));
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(framed(' '.repeat(indent) + current));
  return lines;
}

const out = [];

out.push(rule('╔', '╗'));
out.push(framed());
for (const row of logo) out.push(framed(row, 'center'));
out.push(framed());
out.push(framed('.oO  TINKSOFT PROUDLY PRESENTS  Oo.', 'center'));
out.push(framed('building software in public // est. 2026', 'center'));
out.push(framed());

out.push(section('RELEASE iNFO'));
out.push(framed());
out.push(field('RELEASE NAME', 'tinksoft.com'));
out.push(field('TYPE', 'website / build log'));
out.push(field('SUPPLiER', 'tink'));
out.push(field('RELEASE DATE', '2026-06-09'));
out.push(field('PLATFORM', 'any browser since ~1996'));
out.push(field('SiZE', 'measured live at /colophon/'));
out.push(field('JAVASCRiPT', '0 bytes -- none, never'));
out.push(field('PROTECTiON', "CSP default-src 'none'"));
out.push(field('FORMAT', 'static HTML / inline CSS'));
out.push(field('HOSTiNG', 'GitHub Pages'));
out.push(framed());

out.push(section('GROUP NOTES'));
out.push(framed());
out.push(...wrap('Built in public. Every win, every bug, every weekend lost to a missing semicolon -- logged.'));
out.push(framed());
out.push(...wrap('The constraint is the point: plain HTML, inline CSS, a strict CSP, no trackers, and no framework shipped to your browser. One document request, plus the frozen counter.'));
out.push(framed());
out.push(...wrap("Do a lot with a little. The demoscene fit whole worlds into 64 KB; a page that fits in a single TCP round trip is this site's modest tribute to that tradition."));
out.push(framed());
out.push(...wrap('One entry a week, minimum. No polish. No marketing. Just what happened.'));
out.push(framed());

out.push(section('GREETZ FLY OUT TO'));
out.push(framed());
out.push(...wrap('The demoscene . the old web . wiby.me . neocities . 512kb.club . textfiles.com . 16colo.rs . nownownow.com . everyone shipping small things in public . and you, for reading this far.'));
out.push(framed());

out.push(section("WE'RE LOOKiNG FOR"));
out.push(framed());
out.push(...wrap("Nothing, honestly. It's a one-wizard operation. But if you keep a build log of your own, drop a line and I'll link you on /links/."));
out.push(framed());

out.push(section('CONTACT'));
out.push(framed());
out.push(field('WEB', 'https://tinksoft.com'));
out.push(field('E-MAiL', 'tinkxiu@gmail.com'));
out.push(field('GiTHUB', 'github.com/tinkthemaker'));
out.push(field('RSS', 'tinksoft.com/rss.xml'));
out.push(field('NFO', 'tinksoft.com/tinksoft.nfo'));
out.push(framed());

out.push(section('EOF'));
out.push(framed('UTF-8 // MONOSPACE // 70 COLUMNS // 0 KB JS', 'center'));
out.push(framed('tinksoft.com // est. 2026 // made by tink', 'center'));
out.push(rule('╚', '╝'));

// GitHub Pages serves .nfo files without a charset; the UTF-8 signature keeps
// browsers from decoding the box-drawing characters as Windows-1252.
const text = '\uFEFF' + out.join('\n') + '\n';
writeFileSync('public/tinksoft.nfo', text);
console.log(`wrote ${out.length} lines at ${WIDTH} columns`);
