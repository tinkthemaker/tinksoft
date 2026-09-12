import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Raw HTML in markdown bodies is parsed, then reduced to this allowlist. Shiki's inline
// colours and Astro's heading ids are kept; everything else (scripts, event
// handlers, <meta>, <iframe>, non-http(s) links) is dropped.
const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: '',
  attributes: {
    ...defaultSchema.attributes,
    pre: ['className', 'style', 'tabIndex', 'dataLanguage'],
    code: ['className'],
    span: ['className', 'style'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto', 'tel'],
    src: ['http', 'https'],
  },
};

export default defineConfig({
  site: 'https://tinksoft.com',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeRaw, [rehypeSanitize, sanitizeSchema]],
  },
  build: {
    inlineStylesheets: 'always',
  },
});
