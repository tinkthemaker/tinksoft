# tinksoft.com

A personal site for notes on software, security, games, and anything else I
find worth posting. Built with [Astro](https://astro.build) — markdown in,
plain HTML out.

## The numbers

- **0 KB JavaScript** shipped to the browser
- **2 HTTP requests** per page — the document and decorative counter; CSS and favicon are inlined
- Build-time page-count and size measurements on the [colophon](https://tinksoft.com/colophon/)
- `Content-Security-Policy: default-src 'none'` (via meta tag — GitHub Pages doesn't support custom HTTP headers)
- Full dark mode via `prefers-color-scheme` — no toggle, no JS, no flash
- RSS feed, sitemap, robots.txt, humans.txt, and a proper [.nfo file](https://tinksoft.com/tinksoft.nfo)
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
project's page under "related posts".

## Local development

```bash
npm install
npm run dev      # live preview at localhost:4321
npm run build    # production build to dist/ (also computes colophon stats)
```

## Deploying

GitHub Actions builds and publishes to GitHub Pages on every push to `main`
(`.github/workflows/pages.yml`). Publishing is:

```bash
git add . && git commit -m "log: new post" && git push
```

Setup (one-time): GitHub repo → Settings → Pages → Build and deployment →
Source → select **GitHub Actions**. Then add `tinksoft.com` as the custom domain
and set the DNS records GitHub shows at your registrar. The workflow copies
the repository's `CNAME` file into `dist/` for each deployment.

## Map

- `src/content/blog/` — log posts (markdown)
- `src/content/projects/` — projects (markdown)
- `src/layouts/Base.astro` — all HTML structure + all CSS
- `src/pages/` — page templates, colophon, and the RSS route
- `scripts/` — build stamp + colophon stats injection (runs in `npm run build`)
- `public/` — tinksoft.nfo, humans.txt, robots.txt, badge.svg (88×31 button)
- `.github/workflows/pages.yml` — build + deploy to GitHub Pages
- The visitor counter is decorative and static.
