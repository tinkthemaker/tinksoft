import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BUDGET, measure } from './lib/measure.mjs';

const DIST = 'dist';
const kb = (n) => (n / 1024).toFixed(1);

let duration = '?';
if (existsSync('.build-start')) {
  duration = ((Date.now() - Number(readFileSync('.build-start', 'utf8'))) / 1000).toFixed(1);
}
const builtAt = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

const colophon = join(DIST, 'colophon', 'index.html');
const template = readFileSync(colophon, 'utf8');

function aggregate(files) {
  let rawTotal = 0;
  let gzTotal = 0;
  let heaviest = { url: '', gz: 0 };
  for (const file of files) {
    rawTotal += file.raw;
    gzTotal += file.gz;
    if (file.gz > heaviest.gz) heaviest = file;
  }
  return { files, rawTotal, gzTotal, heaviest };
}

function render(stats) {
  return template
    .replaceAll('@PAGES@', String(stats.files.length))
    .replaceAll('@RAW_KB@', kb(stats.rawTotal))
    .replaceAll('@GZ_KB@', kb(stats.gzTotal))
    .replaceAll('@AVG_GZ@', kb(stats.gzTotal / stats.files.length))
    .replaceAll('@HEAVIEST@', stats.heaviest.url)
    .replaceAll('@HEAVIEST_GZ@', kb(stats.heaviest.gz))
    .replaceAll('@BUDGET_KB@', kb(BUDGET))
    .replaceAll('@WORST_PCT@', ((stats.heaviest.gz / BUDGET) * 100).toFixed(1))
    .replaceAll('@BUILD_S@', duration)
    .replaceAll('@BUILT_AT@', builtAt);
}

// The colophon page displays its own metrics, so substituting the values
// changes the page's measured size. Iterate to a fixed point so the published
// totals and heaviest-page values reflect the final bytes, not placeholders.
let html = render(aggregate(measure(DIST)));
for (let i = 0; i < 5; i++) {
  writeFileSync(colophon, html);
  const next = render(aggregate(measure(DIST)));
  if (next === html) break;
  html = next;
}
writeFileSync(colophon, html);

const files = measure(DIST);
let rawTotal = 0;
let gzTotal = 0;
for (const file of files) {
  rawTotal += file.raw;
  gzTotal += file.gz;
}

console.log(
  `[colophon] ${files.length} pages, ${kb(rawTotal)} KB raw, ${kb(gzTotal)} KB gz, built in ${duration}s`
);
