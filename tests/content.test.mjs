import assert from 'node:assert/strict';
import test from 'node:test';

import { collectTags, contentId, PROJECT_STATUS, tagPath } from '../src/lib/content.mjs';

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

test('contentId derives a single-segment kebab-case id from slug or path', () => {
  assert.equal(contentId('blog', { entry: 'hello-world.md', data: {} }), 'hello-world');
  assert.equal(contentId('blog', { entry: 'hello-world.md', data: { slug: 'custom-2026' } }), 'custom-2026');
});

test('contentId rejects ids that could break routes or injected HTML', () => {
  for (const slug of ['x"><b>evil</b>', 'a/b', 'Upper', 'with space', '-lead', 'trail-', '']) {
    assert.throws(
      () => contentId('blog', { entry: 'evil.md', data: { slug } }),
      /must match/,
      slug,
    );
  }
  assert.throws(() => contentId('blog', { entry: 'nested/post.md', data: {} }), /must match/);
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
