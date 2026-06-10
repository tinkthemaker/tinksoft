---
title: "building this site"
date: 2026-06-09
description: "The stack behind tinksoft.com and why it's deliberately boring."
tags: [meta, astro]
---

Second post, and it's about the site itself. Fitting.

## the stack

- **Astro** — posts are markdown files, output is plain HTML
- **Zero JavaScript** shipped to the browser
- **Vercel** for hosting, deploys on every git push
- One CSS file's worth of styling, written by hand

## why so minimal?

Every build-in-public site I admired had one thing in common: the friction of
posting was near zero. If publishing an update means opening a CMS, picking a
cover image, and fighting a rich text editor, the updates stop.

Here, a new post is a new `.md` file in a folder. Commit, push, live.

```bash
# the entire publishing workflow
git add src/content/blog/my-update.md
git commit -m "log: my update"
git push
```

## what broke already

The ASCII logo looked great on desktop and wrapped into soup on mobile.
Fixed with `font-size: clamp()` so it scales down instead of wrapping.
First bug of the build log — logged, as promised.
