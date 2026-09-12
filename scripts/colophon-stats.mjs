import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BUDGET, measure } from './lib/measure.mjs';
import { buildDate, formatBuildTimestamp, reproducibleBuild } from './lib/build-time.mjs';

const DIST = 'dist';
const kb = (n) => (n / 1024).toFixed(1);

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

let duration = '?';
if (reproducibleBuild()) {
  // Elapsed wall time would make otherwise reproducible output differ per run.
  duration = '0.0';
} else if (existsSync('.build-start')) {
  duration = ((Date.now() - Number(readFileSync('.build-start', 'utf8'))) / 1000).toFixed(1);
}
const builtAt = formatBuildTimestamp(buildDate());

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

function render(template, stats, { duration, builtAt }) {
  const values = {
    '@PAGES@': stats.files.length,
    '@RAW_KB@': kb(stats.rawTotal),
    '@GZ_KB@': kb(stats.gzTotal),
    '@AVG_GZ@': kb(stats.gzTotal / stats.files.length),
    '@HEAVIEST@': stats.heaviest.url,
    '@HEAVIEST_GZ@': kb(stats.heaviest.gz),
    '@BUDGET_KB@': kb(BUDGET),
    '@WORST_PCT@': ((stats.heaviest.gz / BUDGET) * 100).toFixed(1),
    '@BUILD_S@': duration,
    '@BUILT_AT@': builtAt,
  };
  let html = template;
  for (const [token, value] of Object.entries(values)) {
    html = html.replaceAll(token, escapeHtml(value));
  }
  return html;
}

// The colophon page displays its own metrics, so substituting the values
// changes the page's measured size. Iterate to a fixed point so the published
// totals and heaviest-page values reflect the final bytes, not placeholders.
const context = { duration, builtAt };
let html = render(template, aggregate(measure(DIST)), context);
for (let i = 0; i < 5; i++) {
  writeFileSync(colophon, html);
  const next = render(template, aggregate(measure(DIST)), context);
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
