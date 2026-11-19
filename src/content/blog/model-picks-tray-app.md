---
title: "model picks: a tray app with honest math"
date: 2026-11-18
description: "A 1 MB Windows tray app that picks the best-value model for coding work — and refuses to guess."
tags: [model-picks]
---

Model Picks went from approved design to working app in a day. It is a ~1 MB
Windows tray app that answers one question before starting a project: which
model on OpenRouter gives the most capability for the money, for the work I am
about to do.

## the question

Two categories, two boards of picks. **Code with** covers the model I drive in
a coding agent; **Inside your agents** covers the model my own agents call —
which must support tool use. Each board shows **Budget / Half price / Top** in
the corner panel, with a full ladder behind it.

## where the numbers come from

Three free sources, about 4 requests and 3 MB per refresh:

- **Epoch AI benchmark CSVs** — CursorBench and DeepSWE, real coding scores
  with published cost per task. DeepSWE ships error bars.
- **Artificial Analysis** — the free intelligence index and its cost per task,
  for the agents board.
- **OpenRouter's model list** — what is actually available, at what token
  price, and whether it supports tools. `:free` variants are excluded.

The paid Artificial Analysis tier with coding scores is $417/month, which is
out of proportion for a personal tool — so it is a documented non-goal.

## the math rules

Every number traces to a named source; missing data is shown as missing,
never treated as zero. The rules that survived review:

- A model is dropped if another is at least as good and no more expensive —
  the result is a price-to-score frontier, cheap to expensive.
- Ties are claimed only where error bars exist. `|s_i − s_j| ≤ √(h_i² + h_j²)`,
  the approximate 95% interval for the difference. Boards without error bars
  say "no error bars published" and never claim a tie.
- **Top** is the cheapest frontier entry that no other entry beats by more
  than the error bars — not merely "tied with best", because ties are not
  transitive. That distinction flipped a pick on real data.
- **Budget** is the cheapest entry within a 15-point gap of the best score,
  so the floor cannot drift to a toy model.
- **Half price** is the best entry costing at most half of Top's price.

Two ideas were dropped after testing: "bend in the curve" (unstable depending
on how cost was measured) and "price per point" (needs a dollar figure each
board cannot supply).

## what it is not

It does not call models, test them, blend benchmarks, or track history. It
opens instantly from a local cache, uses about 30 MB idle, and refreshes once
a day. A tray app that noticeably uses memory or CPU is listed in the design
as a failure mode — which felt like the right bar to write down.

The design doc lists "a confident pick that is wrong because two different
models were matched by name" as an anti-goal. Name matching across three
sources with different conventions is where this kind of tool usually goes
quietly wrong, so unmatched names are listed openly rather than guessed.
