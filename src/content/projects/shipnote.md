---
title: "Shipnote"
status: shipped
description: "A chronicler imp that reads the git log and drafts the changelog."
started: 2025-12-05
repo: https://github.com/tinkthemaker/shipnote
tag: shipnote
---

A chronicler imp for releases. Point it at a git range and it drafts the
changelog: commits grouped by conventional-commit type, PRs linked, breaking
changes surfaced at the top, markdown ready for a release page. There's no
magic in it. It does the mechanical part of release notes so I don't.

## goals

- Read commit messages, not diffs
- Group by type, breaking changes first
- Output that needs editing, never output that pretends to be done

## current status

Shipped. I run it before every release and clean up the draft by hand,
which is exactly the workload it was built to shrink.
