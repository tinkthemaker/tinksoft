---
title: "PulpDescent"
status: wip
description: "A text dungeon in Godot 4 with no LLM. Every word hand-set or grammar-grown."
started: 2026-03-01
repo: https://github.com/tinkthemaker/PulpDescent
tag: pulpdescent
---

A pulp text dungeon crawler. You explore rooms, fight, find things, read
flavor text. The catch: no LLM anywhere in it. No bound spirit does the
writing. Every word is hand-authored or grown from a deterministic
procedural grammar.

## why no bound spirit

I wanted the game to be:

- **Reproducible.** Same seed, same run, forever.
- **Offline.** No API key, no rate limit, no outage to apologize for.
- **Cheap.** Zero inference cost per session.
- **Inspectable.** I can read every line of generated prose and say exactly
  why it appeared.

Working inside that vow forced better design. The grammar system turned out
to be more interesting than any prompt I could have written.

## current status

In active development. Combat and discovery are in. What remains is
content, balance, and the lessons only fifty hours of playtesting will
teach.
