// One-shot generator for the warez-style .nfo file.
// Run: node scripts/gen-nfo.mjs
import { writeFileSync } from 'node:fs';

const W = 62; // total box width (║ to ║)
const inner = W - 4; // content area between '║ ' and ' ║'

function boxTop(label) {
  // overhead: ╔ ═ [ ] ╗ = 5 chars, so ═ count = W - 5 - label.length
  const n = W - 5 - label.length;
  return '╔═[' + label + ']' + '═'.repeat(n) + '╗';
}
function boxBot() { return '╚' + '═'.repeat(W - 2) + '╝'; }
function line(text) {
  text = text.length > inner ? text.slice(0, inner) : text;
  return '║ ' + text + ' '.repeat(inner - text.length) + ' ║';
}
function empty() { return '║' + ' '.repeat(W - 2) + '║'; }

const logo = [
  '  ██████████████████████████████████████████████████████████████',
  '  ██                                                          ██',
  '  ██   _____ ___ _   _ _  ______   ___  _____ _____           ██',
  '  ██  |_   _|_ _| \\ | | |/ / ___| / _ \\|  ___|_   _|         ██',
  '  ██    | |  | ||  \\| | \' /\\___ \\| | | | |_    | |          ██',
  '  ██    | |  | || |\\  | . \\ ___) | |_| |  _|   | |          ██',
  '  ██    |_| |___|_| \\_|_|\\_\\____/ \\___/|_|     |_|          ██',
  '  ██                                                          ██',
  '  ██   .com // building software in public // est. 2026       ██',
  '  ██                                                          ██',
  '  ██████████████████████████████████████████████████████████████',
];

const divider = '  ░' + '░'.repeat(W - 4) + '░  ';

const sections = [];

// ── RELEASE iNFO ──
sections.push(boxTop('RELEASE iNFO'));
sections.push(empty());
sections.push(line('  RELEASE NAME..: tinksoft.com'));
sections.push(line('  TYPE..........: website / build log'));
sections.push(line('  SUPPLiER......: tink'));
sections.push(line('  RELEASE DATE..: 06-09-2026'));
sections.push(line('  PLATFORM......: any browser since ~1996'));
sections.push(line('  SiZE..........: ~2.5 KB gzipped per page'));
sections.push(line('  JAVASCRiPT....: 0 bytes — none, never'));
sections.push(line('  PROTECTiON....: CSP default-src none'));
sections.push(line('  FORMAT........: static HTML, CSS inlined'));
sections.push(line('  HOSTiNG.......: GitHub Pages'));
sections.push(empty());
sections.push(boxBot());

// ── GROUP NOTES ──
sections.push('');
sections.push(boxTop('GROUP NOTES'));
sections.push(empty());
sections.push(line("  built in public. every win, every bug, every"));
sections.push(line("  weekend lost to a missing semicolon — logged."));
sections.push(empty());
sections.push(line("  the constraint is the point: plain HTML, CSS"));
sections.push(line("  inlined, favicon inlined, strict CSP, no"));
sections.push(line("  trackers, no frameworks shipped to your"));
sections.push(line("  browser. one HTTP request per page."));
sections.push(empty());
sections.push(line("  do a lot with a little. the demoscene fit"));
sections.push(line("  whole worlds into 64 KB. a page that fits in"));
sections.push(line("  a single TCP round trip is this site's modest"));
sections.push(line("  tribute to that tradition."));
sections.push(empty());
sections.push(line("  one entry a week, minimum. no polish, no"));
sections.push(line("  marketing. just what happened."));
sections.push(empty());
sections.push(boxBot());

// ── GREETZ ──
sections.push('');
sections.push(boxTop('GREETZ FLY OUT TO'));
sections.push(empty());
sections.push(line("  the demoscene  .  the old web  .  wiby.me"));
sections.push(line("  neocities  .  512kb.club  .  textfiles.com"));
sections.push(line("  16colo.rs  .  nownownow.com  .  everyone"));
sections.push(line("  shipping small things in public  .  you,"));
sections.push(line("  for reading this far"));
sections.push(empty());
sections.push(boxBot());

// ── WE'RE LOOKiNG FOR ──
sections.push('');
sections.push(boxTop("WE'RE LOOKiNG FOR"));
sections.push(empty());
sections.push(line("  nothing, honestly. it's a one-wizard"));
sections.push(line("  operation. but if you keep a build log of"));
sections.push(line("  your own, drop a line and i'll link you on"));
sections.push(line("  /links/."));
sections.push(empty());
sections.push(boxBot());

// ── CONTACT ──
sections.push('');
sections.push(boxTop('CONTACT'));
sections.push(empty());
sections.push(line('  WEB..........: https://tinksoft.com'));
sections.push(line('  E-MAiL.......: tinkxiu@gmail.com'));
sections.push(line('  GiTHUB.......: github.com/tinkthemaker'));
sections.push(line('  RSS..........: tinksoft.com/rss.xml'));
sections.push(line('  NFO..........: tinksoft.com/tinksoft.nfo'));
sections.push(empty());
sections.push(boxBot());

const footer = [
  '',
  '   ┌──────────────────────────────────────────────────────────────┐',
  "   │  if you can read this, you're viewing it in the right font   │",
  '   │  CP437 / VGA — anything else and the boxes look wrong        │',
  '   └──────────────────────────────────────────────────────────────┘',
  '',
  '                    tinksoft.com // est. 2026 // made by tink',
  '',
];

const out = logo.join('\n') + '\n' + divider + '\n' + sections.join('\n') + '\n' + footer.join('\n');
writeFileSync('public/tinksoft.nfo', out);
console.log(`wrote ${out.split('\n').length} lines`);
