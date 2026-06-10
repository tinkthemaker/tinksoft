import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = htmlFiles(DIST);
let rawTotal = 0;
let gzTotal = 0;
let heaviest = { path: '', gz: 0 };

for (const f of files) {
  const buf = readFileSync(f);
  const gz = gzipSync(buf, { level: 9 }).length;
  rawTotal += buf.length;
  gzTotal += gz;
  if (gz > heaviest.gz) heaviest = { path: f, gz };
}

const kb = (n) => (n / 1024).toFixed(1);
const heaviestUrl =
  '/' + heaviest.path.replace(/^dist[\\/]/, '').replace(/index\.html$/, '').replace(/\\/g, '/');

let duration = '?';
if (existsSync('.build-start')) {
  duration = ((Date.now() - Number(readFileSync('.build-start', 'utf8'))) / 1000).toFixed(1);
}
const builtAt = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

const colophon = join(DIST, 'colophon', 'index.html');
let html = readFileSync(colophon, 'utf8');
html = html
  .replaceAll('@PAGES@', String(files.length))
  .replaceAll('@RAW_KB@', kb(rawTotal))
  .replaceAll('@GZ_KB@', kb(gzTotal))
  .replaceAll('@AVG_GZ@', kb(gzTotal / files.length))
  .replaceAll('@HEAVIEST@', heaviestUrl)
  .replaceAll('@HEAVIEST_GZ@', kb(heaviest.gz))
  .replaceAll('@BUILD_S@', duration)
  .replaceAll('@BUILT_AT@', builtAt);
writeFileSync(colophon, html);

console.log(
  `[colophon] ${files.length} pages, ${kb(rawTotal)} KB raw, ${kb(gzTotal)} KB gz, built in ${duration}s`
);
