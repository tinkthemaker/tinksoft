/**
 * Convert a display tag to the stable path used by every tag link and route.
 *
 * @param {string} tag
 */
export function tagPath(tag) {
  return tag.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Group posts by their tag path while rejecting ambiguous or unusable routes.
 *
 * @template {{ data: { tags: string[] } }} Post
 * @param {Post[]} posts
 * @returns {Map<string, { name: string, path: string, posts: Post[] }>}
 */
export function collectTags(posts) {
  const tags = new Map();

  for (const post of posts) {
    for (const name of post.data.tags) {
      const path = tagPath(name);
      if (!path) {
        throw new Error(`Tag "${name}" does not produce a URL-safe path.`);
      }

      const entry = tags.get(path);
      if (entry && entry.name !== name) {
        throw new Error(`Tag slug collision: "${entry.name}" and "${name}" both map to "${path}".`);
      }

      const tag = entry ?? { name, path, posts: [] };
      tag.posts.push(post);
      tags.set(path, tag);
    }
  }

  return tags;
}

export const PROJECT_STATUS = Object.freeze({
  wip: Object.freeze({ order: 0, name: 'active', code: 'RUN', note: 'work in progress' }),
  shipped: Object.freeze({ order: 1, name: 'shipped', code: 'OK', note: 'released and in use' }),
  idea: Object.freeze({ order: 2, name: 'queued', code: 'WAIT', note: 'not started' }),
});

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Derive a content entry id from its frontmatter `slug` or file path and reject
 * anything outside the single-segment, kebab-case set every route expects.
 *
 * @param {string} collection
 * @param {{ entry: string, data: Record<string, unknown> }} input
 */
export function contentId(collection, { entry, data }) {
  const id =
    typeof data.slug === 'string'
      ? data.slug
      : entry.replace(/\\/g, '/').replace(/\.mdx?$/, '');
  if (!SAFE_ID.test(id)) {
    throw new Error(
      `${collection}/${entry}: id "${id}" must match ${SAFE_ID} (lowercase letters, digits, hyphens).`,
    );
  }
  return id;
}
