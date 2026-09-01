import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BUDGET, measure } from './lib/measure.mjs';

const DIST = 'dist';
const files = measure(DIST);
let rawTotal = 0;
let gzTotal = 0;
let heaviest = { url: '', gz: 0 };

for (const file of files) {
  rawTotal += file.raw;
  gzTotal += file.gz;
  if (file.gz > heaviest.gz) heaviest = file;
}

const kb = (n) => (n / 1024).toFixed(1);

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
  .replaceAll('@HEAVIEST@', heaviest.url)
  .replaceAll('@HEAVIEST_GZ@', kb(heaviest.gz))
  .replaceAll('@BUDGET_KB@', kb(BUDGET))
  .replaceAll('@WORST_PCT@', ((heaviest.gz / BUDGET) * 100).toFixed(1))
  .replaceAll('@BUILD_S@', duration)
  .replaceAll('@BUILT_AT@', builtAt);
writeFileSync(colophon, html);

console.log(
  `[colophon] ${files.length} pages, ${kb(rawTotal)} KB raw, ${kb(gzTotal)} KB gz, built in ${duration}s`
);
