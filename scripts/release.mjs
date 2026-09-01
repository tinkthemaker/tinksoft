import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

const DIST = 'dist';
const releaseDate = new Date();
const date = releaseDate.toISOString().slice(0, 10).replaceAll('-', '');
const releaseName = `tinksoft-${date}.zip`;
const releaseDir = `${DIST}/releases`;

const dizLines = [
  ' T I N K S O F T . C O M  ::  T E X T  R E L',
  ' -------------------------------------------',
  ' Personal site: notes on software,',
  ' security, games, and whatever else.',
  ' Static HTML. 0 KB JavaScript. No',
  ' tracking. Every page under 14 KB gz.',
  ' Inside: full plain text of every log',
  ' post, the .nfo, and SHA-256 sums.',
  ' -------------------------------------------',
  ' https://tinksoft.com   ::   RSS + .NFO',
  ' (c) 2026 tink                        EOF',
];
if (dizLines.length > 13 || dizLines.some((line) => line.length > 45)) {
  throw new Error('FILE_ID.DIZ exceeds its 13-line or 45-column limit');
}
const diz = Buffer.from(`${dizLines.join('\r\n')}\r\n`, 'utf8');

const entries = [
  { name: 'FILE_ID.DIZ', data: diz },
  { name: 'TINKSOFT.NFO', data: readFileSync('public/tinksoft.nfo') },
];
const logDir = `${DIST}/log`;
for (const name of readdirSync(logDir).filter((name) => name.endsWith('.txt')).sort()) {
  entries.push({ name: `LOG/${name}`, data: readFileSync(`${logDir}/${name}`) });
}

const sums = entries
  .map(({ name, data }) => `${createHash('sha256').update(data).digest('hex')}  ${name}`)
  .sort((a, b) => a.localeCompare(b))
  .join('\n');
entries.push({ name: 'SHA256SUMS', data: Buffer.from(`${sums}\n`, 'utf8') });

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
const crc32 = (buf) => {
  let value = 0xffffffff;
  for (const byte of buf) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};

const dosTime = 0;
const year = releaseDate.getUTCFullYear();
const dosDate = ((year - 1980) << 9) | ((releaseDate.getUTCMonth() + 1) << 5) | releaseDate.getUTCDate();
const localParts = [];
const centralParts = [];
let offset = 0;
for (const entry of entries) {
  const name = Buffer.from(entry.name, 'utf8');
  const compressed = deflateRawSync(entry.data, { level: 9 });
  const crc = crc32(entry.data);
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(entry.data.length, 22);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);
  localParts.push(local, compressed);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(entry.data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  name.copy(central, 46);
  centralParts.push(central);
  offset += local.length + compressed.length;
}

const central = Buffer.concat(centralParts);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(entries.length, 8);
eocd.writeUInt16LE(entries.length, 10);
eocd.writeUInt32LE(central.length, 12);
eocd.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...localParts, central, eocd]);

mkdirSync(releaseDir, { recursive: true });
const zipPath = `${releaseDir}/${releaseName}`;
writeFileSync(zipPath, zip);

const releasePage = `${releaseDir}/index.html`;
let html = readFileSync(releasePage, 'utf8');
html = html
  .replaceAll('@REL_NAME@', releaseName)
  .replaceAll('@REL_KB@', (zip.length / 1024).toFixed(1))
  .replaceAll('@REL_SHA@', createHash('sha256').update(zip).digest('hex'))
  .replaceAll('@REL_FILES@', String(entries.length))
  .replaceAll('@REL_PATH@', `/releases/${releaseName}`);
writeFileSync(releasePage, html);

console.log(`[release] ${releaseName}, ${entries.length} entries, ${(zip.length / 1024).toFixed(1)} KB`);
