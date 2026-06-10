import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
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
