import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentId } from './lib/content.mjs';

const webUrl = z
  .string()
  .url()
  .refine((value) => /^https?:$/.test(new URL(value).protocol), { message: 'Only http(s) URLs are allowed' });

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: (input) => contentId('blog', input),
  }),
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
    generateId: (input) => contentId('projects', input),
  }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['shipped', 'wip', 'idea']),
    description: z.string(),
    started: z.coerce.date().optional(),
    link: webUrl.optional(),
    repo: webUrl.optional(),
    tag: z.string().optional(),
  }),
});

export const collections = { blog, projects };
