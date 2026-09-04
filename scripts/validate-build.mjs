import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const DIST = resolve('dist');
const SITE = 'https://tinksoft.com';
const errors = [];

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir).sort((a, b) => a.localeCompare(b))) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) files.push(...walk(file));
    else files.push(file);
  }
  return files;
}

function pageUrl(file) {
  return `/${relative(DIST, file).replaceAll('\\', '/').replace(/index\.html$/, '')}`;
}

function localTarget(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  const relativePath = decoded.replace(/^\/+/, '');
  const exact = resolve(DIST, relativePath);
  if (exact !== DIST && !exact.startsWith(`${DIST}${sep}`)) return undefined;
  if (existsSync(exact) && !statSync(exact).isDirectory()) return exact;
  const index = join(exact, 'index.html');
  return existsSync(index) ? index : undefined;
}

function idsIn(html) {
  const ids = [];
  for (const match of html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) ids.push(match[2]);
  return ids;
}

function validateHtml(files) {
  const htmlFiles = files.filter((file) => extname(file) === '.html');
  const htmlCache = new Map();
  const load = (file) => {
    if (!htmlCache.has(file)) htmlCache.set(file, readFileSync(file, 'utf8'));
    return htmlCache.get(file);
  };

  for (const file of htmlFiles) {
    const url = pageUrl(file);
    const html = load(file);
    for (const pattern of [
      [/^<!doctype html>/i, 'doctype'],
      [/<html(?:\s|>)/i, '<html>'],
      [/<html\b[^>]*\blang\s*=\s*(["'])[^"']+\1/i, '<html lang>'],
      [/<head(?:\s|>)/i, '<head>'],
      [/<title(?:\s|>)/i, '<title>'],
      [/<body(?:\s|>)/i, '<body>'],
      [/<\/html>\s*$/i, 'closing </html>'],
    ]) {
      if (!pattern[0].test(html)) errors.push(`${url}: missing ${pattern[1]}`);
    }

    const placeholders = [...new Set(html.match(/@[A-Z][A-Z0-9_]*@/g) ?? [])];
    if (placeholders.length) errors.push(`${url}: unresolved placeholder(s): ${placeholders.join(', ')}`);

    const ids = idsIn(html);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicates.length) errors.push(`${url}: duplicate id(s): ${duplicates.join(', ')}`);

    const mainCount = [...html.matchAll(/<main(?:\s|>)/gi)].length;
    if (mainCount !== 1) errors.push(`${url}: expected one <main>, found ${mainCount}`);
    const headingCount = [...html.matchAll(/<h1(?:\s|>)/gi)].length;
    if (headingCount !== 1) errors.push(`${url}: expected one <h1>, found ${headingCount}`);

    for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
      const attributes = image[1];
      if (!/\balt\s*=\s*(["']).*?\1/is.test(attributes)) errors.push(`${url}: image is missing alt text`);
      if (!/\bwidth\s*=\s*(["'])?\d+\1/i.test(attributes) || !/\bheight\s*=\s*(["'])?\d+\1/i.test(attributes)) {
        errors.push(`${url}: image is missing numeric width/height attributes`);
      }
    }

    for (const script of html.matchAll(/<script\b([^>]*)>/gi)) {
      const type = /\btype\s*=\s*(["'])(.*?)\1/i.exec(script[1])?.[2].toLowerCase();
      if (type !== 'application/ld+json') errors.push(`${url}: executable <script> is not allowed`);
    }

    for (const match of html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
      const value = match[2].replaceAll('&amp;', '&');
      if (!value || /^(?:data:|mailto:|tel:)/i.test(value)) continue;
      if (/^javascript:/i.test(value)) {
        errors.push(`${url}: unsafe URL ${value}`);
        continue;
      }

      let targetUrl;
      try {
        targetUrl = new URL(value, `${SITE}${url}`);
      } catch {
        errors.push(`${url}: invalid URL ${value}`);
        continue;
      }
      if (targetUrl.origin !== SITE) continue;

      const target = localTarget(targetUrl.pathname);
      if (!target) {
        errors.push(`${url}: broken local reference ${value}`);
        continue;
      }

      if (targetUrl.hash && extname(target) === '.html') {
        let fragment;
        try {
          fragment = decodeURIComponent(targetUrl.hash.slice(1));
        } catch {
          errors.push(`${url}: invalid fragment in ${value}`);
          continue;
        }
        if (fragment && !idsIn(load(target)).includes(fragment)) {
          errors.push(`${url}: missing fragment target ${value}`);
        }
      }
    }
  }

  return htmlFiles.length;
}

function validateManifest(files) {
  const manifest = join(DIST, 'checksums.txt');
  if (!existsSync(manifest)) {
    errors.push('/checksums.txt: missing deploy manifest');
    return 0;
  }

  const entries = new Map();
  for (const line of readFileSync(manifest, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) {
      errors.push(`/checksums.txt: malformed line ${JSON.stringify(line)}`);
      continue;
    }
    if (entries.has(match[2])) errors.push(`/checksums.txt: duplicate entry ${match[2]}`);
    entries.set(match[2], match[1]);
  }

  const expected = files
    .filter((file) => file !== manifest)
    .map((file) => relative(DIST, file).replaceAll('\\', '/'));
  for (const name of expected) {
    const file = resolve(DIST, name);
    const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (!entries.has(name)) errors.push(`/checksums.txt: missing ${name}`);
    else if (entries.get(name) !== actual) errors.push(`/checksums.txt: hash mismatch for ${name}`);
  }
  for (const name of entries.keys()) {
    if (!expected.includes(name)) errors.push(`/checksums.txt: entry does not exist: ${name}`);
  }
  return entries.size;
}

function readZipEntries(zip) {
  const entries = new Map();
  let offset = 0;
  while (offset + 4 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const flags = zip.readUInt16LE(offset + 6);
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const size = zip.readUInt32LE(offset + 22);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    if (flags & 0x0008) throw new Error('data descriptors are not supported');
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > zip.length) throw new Error('truncated local entry');
    const name = zip.subarray(nameStart, nameStart + nameLength).toString('utf8');
    const compressed = zip.subarray(dataStart, dataEnd);
    const data = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : undefined;
    if (!data) throw new Error(`unsupported compression method ${method}`);
    if (data.length !== size) throw new Error(`${name} has the wrong uncompressed size`);
    if (entries.has(name)) throw new Error(`duplicate entry ${name}`);
    entries.set(name, data);
    offset = dataEnd;
  }

  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0 || eocd + 22 > zip.length) throw new Error('missing end-of-central-directory record');
  if (zip.readUInt16LE(eocd + 10) !== entries.size) throw new Error('central-directory entry count mismatch');
  if (zip.readUInt32LE(eocd + 16) !== offset) throw new Error('central-directory offset mismatch');
  return entries;
}

function validateRelease() {
  const releaseDir = join(DIST, 'releases');
  const page = join(releaseDir, 'index.html');
  if (!existsSync(page)) {
    errors.push('/releases/: missing release page');
    return 0;
  }

  const zipNames = readdirSync(releaseDir).filter((name) => name.endsWith('.zip'));
  if (zipNames.length !== 1) {
    errors.push(`/releases/: expected one ZIP, found ${zipNames.length}`);
    return 0;
  }
  const zipName = zipNames[0];
  const zip = readFileSync(join(releaseDir, zipName));
  const releaseHtml = readFileSync(page, 'utf8');
  const zipHash = createHash('sha256').update(zip).digest('hex');
  if (!releaseHtml.includes(`/releases/${zipName}`)) errors.push(`/releases/: page does not link to ${zipName}`);
  if (!releaseHtml.includes(zipHash)) errors.push(`/releases/: page does not contain the ZIP checksum`);

  let entries;
  try {
    entries = readZipEntries(zip);
  } catch (error) {
    errors.push(`/releases/${zipName}: invalid ZIP: ${error.message}`);
    return 0;
  }
  for (const required of ['FILE_ID.DIZ', 'TINKSOFT.NFO', 'SHA256SUMS']) {
    if (!entries.has(required)) errors.push(`/releases/${zipName}: missing ${required}`);
  }

  if (entries.has('SHA256SUMS')) {
    const sums = new Map();
    for (const line of entries.get('SHA256SUMS').toString('utf8').trimEnd().split('\n')) {
      const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
      if (!match) {
        errors.push(`/releases/${zipName}: malformed SHA256SUMS line ${JSON.stringify(line)}`);
        continue;
      }
      sums.set(match[2], match[1]);
    }
    for (const [name, data] of entries) {
      if (name === 'SHA256SUMS') continue;
      const actual = createHash('sha256').update(data).digest('hex');
      if (sums.get(name) !== actual) errors.push(`/releases/${zipName}: checksum mismatch for ${name}`);
    }
    for (const name of sums.keys()) {
      if (!entries.has(name)) errors.push(`/releases/${zipName}: SHA256SUMS names missing entry ${name}`);
    }
  }
  return entries.size;
}

if (!existsSync(DIST)) {
  console.error('[validate] dist does not exist; run the build first');
  process.exit(1);
}

const files = walk(DIST);
const htmlCount = validateHtml(files);
const manifestCount = validateManifest(files);
const releaseCount = validateRelease();
if (errors.length) {
  console.error(`[validate] ${errors.length} error(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `[validate] ${htmlCount} HTML pages, ${manifestCount} manifest entries, ${releaseCount} release entries verified`
  );
}
