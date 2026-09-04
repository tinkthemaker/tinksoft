import assert from 'node:assert/strict';
import test from 'node:test';

import { collectTags, PROJECT_STATUS, tagPath } from '../src/lib/content.mjs';

const post = (...tags) => ({ data: { tags } });

test('tagPath preserves the existing URL normalization', () => {
  assert.equal(tagPath('  Small Web  '), 'small-web');
  assert.equal(tagPath('C++ / Games'), 'c--games');
  assert.equal(tagPath('already--slugged'), 'already--slugged');
});

test('collectTags supports an empty post collection', () => {
  assert.deepEqual([...collectTags([])], []);
});

test('collectTags groups repeated tags without losing post order', () => {
  const first = post('Astro', 'Small Web');
  const second = post('Astro');
  const tags = collectTags([first, second]);

  assert.deepEqual([...tags.keys()], ['astro', 'small-web']);
  assert.deepEqual(tags.get('astro'), {
    name: 'Astro',
    path: 'astro',
    posts: [first, second],
  });
});

test('collectTags rejects distinct tag names that collide on one path', () => {
  assert.throws(
    () => collectTags([post('small web'), post('small-web')]),
    /Tag slug collision: "small web" and "small-web" both map to "small-web"\./,
  );
});

test('collectTags rejects a tag that cannot form a path', () => {
  assert.throws(
    () => collectTags([post('+++')]),
    /does not produce a URL-safe path/,
  );
});

test('project status metadata keeps display values and ordering together', () => {
  assert.deepEqual(
    Object.entries(PROJECT_STATUS).map(([key, value]) => [
      key,
      value.order,
      value.code,
      value.name,
      value.note,
    ]),
    [
      ['wip', 0, 'RUN', 'active', 'work in progress'],
      ['shipped', 1, 'OK', 'shipped', 'released and in use'],
      ['idea', 2, 'WAIT', 'queued', 'not started'],
    ],
  );
});
