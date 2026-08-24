import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SKIP = new Set(['checksums.txt']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (!SKIP.has(name)) out.push(p);
  }
  return out;
}

const lines = walk(DIST)
  .map((f) => {
    const hash = createHash('sha256').update(readFileSync(f)).digest('hex');
    return `${hash}  ${relative(DIST, f).replace(/\\/g, '/')}`;
  })
  .sort((a, b) => a.localeCompare(b));

const header = [
  '# tinksoft.com deploy manifest',
  `# generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  '# verify a file: sha256sum -c <(grep <filename> checksums.txt)',
  '',
].join('\n');

writeFileSync(join(DIST, 'checksums.txt'), header + lines.join('\n') + '\n');
console.log(`[checksums] ${lines.length} files hashed into checksums.txt`);
