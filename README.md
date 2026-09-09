# tinksoft.com

A personal site for notes on software, security, games, and anything else I
find worth posting. Built with [Astro](https://astro.build) — markdown in,
plain HTML out.

## The numbers

- **0 KB JavaScript** shipped to the browser
- **2 HTTP requests** for a typical page — the document and decorative counter; CSS and favicon are inlined (the About page also loads the link badge)
- Build-time page-count and size measurements on the [colophon](https://tinksoft.com/colophon/)
- `Content-Security-Policy: default-src 'none'` (via meta tag — GitHub Pages doesn't support custom HTTP headers)
- Full dark mode via `prefers-color-scheme` — no toggle, no JS, no flash
- RSS feed, sitemap, robots.txt, humans.txt, and a proper [.nfo file](https://tinksoft.com/tinksoft.nfo)
- Generated archive and tag indexes, plus section navigation on longer posts
- A [colophon](https://tinksoft.com/colophon/) where the site measures itself on every build

## Writing a new post

Create a markdown file in `src/content/blog/`:

```md
---
title: "my update"
date: 2026-06-15
description: "One-line summary shown on the homepage."
tags: [project-name]
---

Post body in markdown.
```

The filename becomes the URL: `week-1-update.md` → `tinksoft.com/log/week-1-update/`.

## Adding a project

Create a markdown file in `src/content/projects/`:

```md
---
title: "my project"
status: wip            # shipped | wip | idea
description: "One-liner for the projects index."
started: 2026-06-15
repo: https://github.com/tinkthemaker/my-project   # optional
link: https://myproject.com                        # optional
tag: my-project        # optional — log posts with this tag appear on the project page
---

The full story of the project in markdown.
```

Tag posts with the project's `tag` and they'll automatically appear on the
project's page under "field notes" and in the site-wide tag index.

## Local development

```bash
npm install
npm run dev      # live preview at localhost:4321
npm run check    # Astro template and TypeScript checks using the strict config
npm test         # content helpers, reproducible build scripts, and validator fixtures
npm run build    # production build and generated artifacts in dist/
npm run validate # type check, tests, production build, then output validation
npm run preview  # serve the production build at localhost:4321
```

`npm run validate` is the local equivalent of the CI quality checks. It verifies
HTML structure, local links and fragments, image attributes, the absence of
executable scripts, resolved build placeholders, deployment checksums, and the
release archive. It does not replace a browser accessibility review; see
[`docs/accessibility-review.md`](docs/accessibility-review.md) for the latest review.

## Build pipeline

`npm run build` runs these steps in order:

1. `stamp.mjs` records the build start time.
2. Astro generates static pages, RSS, plain-text posts, and the sitemap, and
   copies `public/` assets into `dist/`.
3. `release.mjs` packages the plain-text posts, `.nfo`, `FILE_ID.DIZ`, and
   `SHA256SUMS` into a dated ZIP and fills in the release page's download details.
4. `colophon-stats.mjs` fills in the colophon's page counts, sizes, and build data.
5. `size-gate.mjs` writes `size-report.txt` and fails if any HTML page exceeds
   14,336 bytes (14 KB) gzipped.
6. `checksums.mjs` writes the final deployment manifest, `checksums.txt`.

For reproducible build metadata and release archives, set `SOURCE_DATE_EPOCH`
to a nonnegative integer Unix timestamp in seconds. CI uses the latest commit's
timestamp. Without it, local builds use the current time. Changes to generated
pages must happen before the final checksum step.

## Deploying

GitHub Actions builds and publishes to GitHub Pages on every push to `main`
(`.github/workflows/pages.yml`). Pull requests run validation without deploying.
Publishing is:

```bash
git add . && git commit -m "log: new post" && git push
```

Setup (one-time): GitHub repo → Settings → Pages → Build and deployment →
Source → select **GitHub Actions**. Then add `tinksoft.com` as the custom domain
and set the DNS records GitHub shows at your registrar. Astro copies
`public/CNAME` into `dist/CNAME` during each build.

## Map

- `src/content/blog/` — log posts (markdown)
- `src/content/projects/` — projects (markdown)
- `src/content.config.ts` — validated frontmatter schemas for both collections
- `src/layouts/Base.astro` — shared HTML structure, metadata, navigation, and global CSS
- `src/pages/` — page templates and their scoped CSS, RSS, and plain-text routes
- `src/lib/content.mjs` — shared tag routing and project status metadata
- `scripts/` — build artifacts, measurements, checksums, and output validation
- `tests/` — Node test runner tests, including isolated build-validator fixtures
- `tsconfig.json` — strict Astro/TypeScript configuration
- `public/` — tinksoft.nfo, humans.txt, robots.txt, badge.svg (88×31 button)
- `.github/workflows/pages.yml` — build + deploy to GitHub Pages
- The visitor counter is decorative and static.
