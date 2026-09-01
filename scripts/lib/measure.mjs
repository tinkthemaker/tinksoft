import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const BUDGET = 14336;

export function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) out.push(...htmlFiles(file));
    else if (name.endsWith('.html')) out.push(file);
  }
  return out;
}

export function measure(dir) {
  return htmlFiles(dir).map((file) => {
    const buf = readFileSync(file);
    const url =
      '/' + file.replace(/^dist[\\/]/, '').replace(/index\.html$/, '').replace(/\\/g, '/');
    return { file, url, raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
  });
}
