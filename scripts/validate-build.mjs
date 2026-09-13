import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { parse } from 'parse5';

const DIST = resolve('dist');
const SITE = 'https://tinksoft.com';
const errors = [];
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const DATA_URL_ELEMENTS = new Set(['img', 'link']);

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

function elementsIn(document) {
  const elements = [];
  const stack = [document];
  while (stack.length) {
    const node = stack.pop();
    if (node.tagName) elements.push(node);
    const children = node.tagName === 'template' ? node.content?.childNodes : node.childNodes;
    if (children) for (let index = children.length - 1; index >= 0; index -= 1) stack.push(children[index]);
  }
  return elements;
}

function attribute(element, name) {
  return element.attrs.find((attr) => attr.name === name)?.value;
}

function idsIn(elements) {
  return elements.map((element) => attribute(element, 'id')).filter((id) => id !== undefined);
}

function validateHtml(files) {
  const htmlFiles = files.filter((file) => extname(file) === '.html');
  const elementCache = new Map();
  const load = (file) => {
    if (!elementCache.has(file)) elementCache.set(file, elementsIn(parse(readFileSync(file, 'utf8'))));
    return elementCache.get(file);
  };

  for (const file of htmlFiles) {
    const url = pageUrl(file);
    const html = readFileSync(file, 'utf8');
    if (!/^<!doctype html>/i.test(html)) errors.push(`${url}: missing doctype`);
    if (!/<\/html>\s*$/i.test(html)) errors.push(`${url}: missing closing </html>`);

    const placeholders = [...new Set(html.match(/@[A-Z][A-Z0-9_]*@/g) ?? [])];
    if (placeholders.length) errors.push(`${url}: unresolved placeholder(s): ${placeholders.join(', ')}`);

    const elements = load(file);
    const count = (name) => elements.filter((element) => element.tagName === name).length;
    const root = elements.find((element) => element.tagName === 'html');
    if (!/<html(?:\s|>)/i.test(html)) errors.push(`${url}: missing <html>`);
    if (!root || !attribute(root, 'lang')) errors.push(`${url}: missing <html lang>`);
    for (const name of ['head', 'title', 'body']) {
      if (!new RegExp(`<${name}(?:\\s|>)`, 'i').test(html)) errors.push(`${url}: missing <${name}>`);
    }

    const ids = idsIn(elements);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicates.length) errors.push(`${url}: duplicate id(s): ${duplicates.join(', ')}`);

    const mainCount = count('main');
    if (mainCount !== 1) errors.push(`${url}: expected one <main>, found ${mainCount}`);
    const headingCount = count('h1');
    if (headingCount !== 1) errors.push(`${url}: expected one <h1>, found ${headingCount}`);

    for (const element of elements) {
      const name = element.tagName;

      if (name === 'img') {
        if (attribute(element, 'alt') === undefined) errors.push(`${url}: image is missing alt text`);
        if (!/^\d+$/.test(attribute(element, 'width') ?? '') || !/^\d+$/.test(attribute(element, 'height') ?? '')) {
          errors.push(`${url}: image is missing numeric width/height attributes`);
        }
      }

      if (name === 'script' && attribute(element, 'type')?.toLowerCase() !== 'application/ld+json') {
        errors.push(`${url}: executable <script> is not allowed`);
      }

      if (name === 'meta' && /^\s*refresh\s*$/i.test(attribute(element, 'http-equiv') ?? '')) {
        errors.push(`${url}: <meta http-equiv="refresh"> is not allowed`);
      }

      for (const attr of element.attrs) {
        if (/^on/i.test(attr.name)) errors.push(`${url}: inline event handler on <${name}>`);
        if (attr.name !== 'href' && attr.name !== 'src') continue;
        const value = attr.value;
        if (!value) continue;

        let targetUrl;
        try {
          targetUrl = new URL(stripUrlNoise(value), `${SITE}${url}`);
        } catch {
          errors.push(`${url}: invalid URL ${value}`);
          continue;
        }

        const dataAllowed = targetUrl.protocol === 'data:' && DATA_URL_ELEMENTS.has(name) && /^data:image\//i.test(stripUrlNoise(value));
        if (!SAFE_PROTOCOLS.has(targetUrl.protocol) && !dataAllowed) {
          errors.push(`${url}: unsafe URL scheme in <${name} ${attr.name}> ${value}`);
          continue;
        }
        if (targetUrl.origin !== SITE) continue;

        checkLocalReference(url, value, targetUrl, load);
      }
    }
  }

  return htmlFiles.length;
}

// Browsers trim leading/trailing C0 controls and spaces and drop tabs and
// newlines anywhere before parsing a URL, so the scheme is checked on the
// same normalized text the browser would see.
function stripUrlNoise(value) {
  return value.replaceAll(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '').replaceAll(/[\t\n\r]/g, '');
}

function checkLocalReference(url, value, targetUrl, load) {
  const target = localTarget(targetUrl.pathname);
  if (!target) {
    errors.push(`${url}: broken local reference ${value}`);
    return;
  }

  if (targetUrl.hash && extname(target) === '.html') {
    let fragment;
    try {
      fragment = decodeURIComponent(targetUrl.hash.slice(1));
    } catch {
      errors.push(`${url}: invalid fragment in ${value}`);
      return;
    }
    if (fragment && !idsIn(load(target)).includes(fragment)) {
      errors.push(`${url}: missing fragment target ${value}`);
    }
  }
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
