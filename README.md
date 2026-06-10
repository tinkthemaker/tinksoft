# tinksoft.com

A 90s-style build log for working in public. Built with [Astro](https://astro.build) — markdown in, plain HTML out, zero JavaScript shipped.

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

## Local development

```bash
npm install
npm run dev      # live preview at localhost:4321
npm run build    # production build to dist/
```

## Deploying to Vercel (one-time setup)

1. Push this folder to a GitHub repo:
   ```bash
   git init && git add -A && git commit -m "initial site"
   gh repo create tinksoft --private --source=. --push
   ```
   (or create the repo on github.com and `git remote add` / `git push` manually)
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Vercel auto-detects Astro — accept the defaults and deploy.
3. In the Vercel project: Settings → Domains → add `tinksoft.com`. Vercel shows you the DNS records to set at your domain registrar (an `A` record to `76.76.21.21`, or change nameservers to Vercel's).

After setup, publishing is just:

```bash
git add . && git commit -m "log: new post" && git push
```

Vercel rebuilds and deploys automatically in ~30 seconds.

## Editing the site

- **Projects list**: edit the array at the top of `src/pages/projects.astro`
- **About page**: `src/pages/about.astro`
- **Styling**: all CSS lives in `src/layouts/Base.astro`
- **Visitor counter**: it's decorative (`Base.astro`, footer). Increment it whenever you feel like you've earned it.
