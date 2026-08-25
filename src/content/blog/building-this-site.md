---
title: "how this site is built"
date: 2026-06-09
description: "Astro, markdown, inline CSS, and no client-side JavaScript."
tags: [meta, astro]
---

Posts and project pages are markdown files. Astro builds them into static HTML.
The shared layout contains the CSS, metadata, navigation, and footer. CSS and
the favicon are inlined into each page. The browser receives no JavaScript.

GitHub Actions builds the site and deploys it to GitHub Pages after each push
to `main`.

## publishing

A post is one markdown file in `src/content/blog/`.

```bash
git add src/content/blog/my-update.md
git commit -m "log: my update"
git push
```

The production build also writes the colophon statistics and SHA-256 manifest.
