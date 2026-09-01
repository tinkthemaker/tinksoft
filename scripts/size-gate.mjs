import { writeFileSync } from 'node:fs';
import { BUDGET, measure } from './lib/measure.mjs';

const DIST = 'dist';
const kb = (bytes) => (bytes / 1024).toFixed(1);
const builtAt = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const pages = measure(DIST).sort((a, b) => b.gz - a.gz);
const width = Math.max(3, ...pages.map((page) => page.url.length));

const rows = pages.map((page) => {
  const percent = (page.gz / BUDGET) * 100;
  const marker = percent > 100 ? 'OVER' : '';
  return `${page.url.padEnd(width)}  ${String(page.gz).padStart(8)}  ${kb(page.gz).padStart(5)} KB  ${`${percent.toFixed(1)}%`.padStart(7)}  ${marker}`;
});

const report = [
  'TINKSOFT PAGE SIZE REPORT',
  `generated ${builtAt}`,
  `budget ${BUDGET} bytes (${kb(BUDGET)} KB)`,
  'rationale: 14 KB fits one TCP slow-start window.',
  '',
  `${'URL'.padEnd(width)}  ${'GZ BYTES'.padStart(8)}  ${'KB'.padStart(8)}  ${'PERCENT'.padStart(7)}  STATUS`,
  ...rows,
  '',
].join('\n');
writeFileSync(`${DIST}/size-report.txt`, report);

const over = pages.filter((page) => page.gz > BUDGET);
if (over.length > 0) {
  console.error(`[size-gate] ${over.length} page(s) exceed the ${BUDGET}-byte budget:`);
  for (const page of over) console.error(`  ${page.url}: ${page.gz} bytes gz (${kb(page.gz)} KB)`);
  process.exitCode = 1;
} else {
  const worst = pages[0];
  console.log(
    `[size-gate] ${pages.length} pages, worst ${kb(worst.gz)} KB gz (${((worst.gz / BUDGET) * 100).toFixed(1)}% of 14.0 KB budget)`
  );
}
