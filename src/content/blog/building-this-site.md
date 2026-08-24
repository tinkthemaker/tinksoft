---
title: "raising this tower"
date: 2026-06-09
description: "The materials behind tinksoft.com, all of them deliberately humble."
tags: [meta, astro]
---

Second entry, and it's about the tower itself.

## the materials

Every entry here is a plain markdown file. Astro, the site builder I'm using,
turns those files into plain HTML when the site is built, then gets out of the
way completely. Nothing scripted reaches your browser. No JavaScript, one CSS
file I wrote by hand, hosted on cheap shared space. That is the whole stack,
and I want it to stay that small.

## why so austere

Every build-in-public blog I admired kept the cost of posting near zero. The
moment publishing means logging into a CMS, hunting for a cover image, and
wrestling a rich text editor, the entries quietly stop. I've watched it happen
to better builders than me, and I've felt the same pull myself.

So here, a new entry is one markdown file dropped in a folder. That's it.

```bash
# the entire publishing ritual
git add src/content/blog/my-update.md
git commit -m "log: my update"
git push
```

Three commands, and it's live. If posting stays that cheap, I'll keep doing it.

## what already broke

The ASCII banner up top looked grand on a desktop monitor and collapsed into
alphabet soup on a phone. The fix was one line, `font-size: clamp()`, which
lets the text shrink to fit the screen instead of wrapping into nonsense. First
bug in the book. Recorded, exactly as I swore it would be.
