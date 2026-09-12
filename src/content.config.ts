import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Entry ids become URL path segments and on-disk directory names, and later
// flow into build scripts that splice them into HTML; only allow a safe set.
const SAFE_ID = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

function safeId(base: string) {
  return ({ entry, data }: { entry: string; data: Record<string, unknown> }) => {
    const id =
      typeof data.slug === 'string'
        ? data.slug
        : entry.replace(/\\/g, '/').replace(/\.mdx?$/, '');
    if (!SAFE_ID.test(id)) {
      throw new Error(
        `${base}/${entry}: id "${id}" must match ${SAFE_ID} (lowercase letters, digits, hyphens, slashes).`,
      );
    }
    return id;
  };
}

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', generateId: safeId('blog') }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/projects',
    generateId: safeId('projects'),
  }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['shipped', 'wip', 'idea']),
    description: z.string(),
    started: z.coerce.date().optional(),
    link: z.string().url().optional(),
    repo: z.string().url().optional(),
    tag: z.string().optional(),
  }),
});

export const collections = { blog, projects };
