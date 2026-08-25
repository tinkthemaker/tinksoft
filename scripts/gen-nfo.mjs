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
out.push(framed('TINKSOFT.COM // PERSONAL FILE // EST. 2026', 'center'));
out.push(framed());

out.push(section('RELEASE iNFO'));
out.push(framed());
out.push(field('RELEASE NAME', 'tinksoft.com'));
out.push(field('TYPE', 'personal website'));
out.push(field('OWNER', 'tink'));
out.push(field('CREATED', '2026-06-09'));
out.push(field('TOPiCS', 'software / security / games / other'));
out.push(field('OUTPUT', 'static HTML / inline CSS'));
out.push(field('CLiENT JS', '0 bytes'));
out.push(field('TRACKiNG', 'none'));
out.push(field('CSP', "default-src 'none'"));
out.push(field('HOSTiNG', 'GitHub Pages'));
out.push(framed());

out.push(section('ABOUT'));
out.push(framed());
out.push(...wrap('This is my personal site. I post notes on software, security, games, tools, and anything else that interests me.'));
out.push(framed());
out.push(...wrap('There is no fixed subject and no posting schedule. If something is here, I wanted to write it down.'));
out.push(framed());

out.push(section('iNDEX'));
out.push(framed());
out.push(field('POSTS', 'tinksoft.com/'));
out.push(field('PROJECTS', 'tinksoft.com/projects/'));
out.push(field('CURRENT', 'tinksoft.com/now/'));
out.push(field('LiNKS', 'tinksoft.com/links/'));
out.push(field('SOURCE', 'github.com/tinkthemaker/tinksoft'));
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
out.push(framed('END OF FILE // NO JAVASCRIPT // NO TRACKING', 'center'));
out.push(rule('╚', '╝'));

// GitHub Pages serves .nfo files without a charset; the UTF-8 signature keeps
// browsers from decoding the box-drawing characters as Windows-1252.
const text = '\uFEFF' + out.join('\n') + '\n';
writeFileSync('public/tinksoft.nfo', text);
console.log(`wrote ${out.length} lines at ${WIDTH} columns`);
