---
title: "Shipnote"
status: shipped
description: "Reads a git range and produces a draft changelog."
started: 2025-12-05
repo: https://github.com/tinkthemaker/shipnote
tag: shipnote
---

Shipnote reads a git range and produces a markdown changelog. It groups
conventional commits, links pull requests, and puts breaking changes first.

## goals

- Read commit messages, not diffs
- Group by type, breaking changes first
- Output that needs editing, never output that pretends to be done

## current status

Shipped. I run it before releases and edit the result by hand.
