import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import {
  buildDate,
  formatBuildTimestamp,
  reproducibleBuild,
  sourceDateEpoch,
} from '../scripts/lib/build-time.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const temporaryDirectories = [];

after(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true });
});

function temporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'tinksoft-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeFixture(root, name, contents) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function runScript(name, cwd, epoch) {
  const result = spawnSync(process.execPath, [join(repoRoot, 'scripts', name)], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, SOURCE_DATE_EPOCH: String(epoch) },
  });
  assert.equal(result.status, 0, `${name} failed:\n${result.stderr || result.stdout}`);
  return result;
}

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

test('build time helpers use and validate SOURCE_DATE_EPOCH', () => {
  const epoch = Math.floor(Date.UTC(2026, 8, 3, 12, 34, 56) / 1000);
  const env = { SOURCE_DATE_EPOCH: String(epoch) };
  assert.equal(sourceDateEpoch(env), epoch);
  assert.equal(buildDate(env).toISOString(), '2026-09-03T12:34:56.000Z');
  assert.equal(formatBuildTimestamp(buildDate(env)), '2026-09-03 12:34 UTC');
  assert.equal(reproducibleBuild(env), true);
  assert.equal(reproducibleBuild({}), false);
  assert.throws(() => sourceDateEpoch({ SOURCE_DATE_EPOCH: 'today' }), /integer number/);
  assert.throws(() => sourceDateEpoch({ SOURCE_DATE_EPOCH: '-1' }), /integer number/);
  assert.throws(() => sourceDateEpoch({ SOURCE_DATE_EPOCH: '9999999999999999' }), /supported date range/);
});

test('checksum manifests are stable and timestamped from SOURCE_DATE_EPOCH', () => {
  const root = temporaryDirectory();
  writeFixture(root, 'dist/z-last.txt', 'z\n');
  writeFixture(root, 'dist/nested/a-first.txt', 'a\n');
  const epoch = Math.floor(Date.UTC(2026, 8, 3, 12, 34, 56) / 1000);

  runScript('checksums.mjs', root, epoch);
  const first = readFileSync(join(root, 'dist', 'checksums.txt'), 'utf8');
  runScript('checksums.mjs', root, epoch);
  const second = readFileSync(join(root, 'dist', 'checksums.txt'), 'utf8');

  assert.equal(second, first);
  assert.match(first, /# generated 2026-09-03 12:34 UTC/);
  const paths = first
    .split('\n')
    .filter((line) => /^[a-f0-9]{64}  /.test(line))
    .map((line) => line.slice(66));
  assert.deepEqual(paths, ['nested/a-first.txt', 'z-last.txt']);
});

test('release archives are byte-for-byte stable for a fixed source epoch', () => {
  const root = temporaryDirectory();
  writeFixture(root, 'public/tinksoft.nfo', 'NFO\n');
  writeFixture(root, 'dist/log/hello.txt', 'Hello from the log.\n');
  writeFixture(
    root,
    'dist/releases/index.html',
    '@REL_NAME@ @REL_KB@ @REL_SHA@ @REL_FILES@ @REL_PATH@'
  );
  const epoch = Math.floor(Date.UTC(2026, 8, 3, 12, 34, 56) / 1000);
  const zipPath = join(root, 'dist', 'releases', 'tinksoft-20260903.zip');

  runScript('release.mjs', root, epoch);
  const first = readFileSync(zipPath);
  const firstHash = hash(first);
  runScript('release.mjs', root, epoch);
  const second = readFileSync(zipPath);

  assert.equal(hash(second), firstHash);
  const expectedDosTime = (12 << 11) | (34 << 5) | 28;
  const expectedDosDate = ((2026 - 1980) << 9) | (9 << 5) | 3;
  assert.equal(first.readUInt16LE(10), expectedDosTime);
  assert.equal(first.readUInt16LE(12), expectedDosDate);
  const releasePage = readFileSync(join(root, 'dist', 'releases', 'index.html'), 'utf8');
  assert.match(releasePage, /tinksoft-20260903\.zip/);
  assert.match(releasePage, new RegExp(firstHash));
});
