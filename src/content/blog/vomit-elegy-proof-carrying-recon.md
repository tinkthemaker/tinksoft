---
title: "vomit elegy: arbitrage with a receipt"
date: 2026-11-07
description: "A Kalshi scanner that refuses to log an opportunity it cannot prove."
tags: [vomit-elegy]
---

[Vomit Elegy](https://github.com/tinkthemaker/vomit-elegy) started this week. It
is a C#/.NET tool that reads Kalshi's public market data, builds portfolios
from payoff constraints the exchange itself declares, and logs only the
opportunities it can prove.

## the idea

Most arbitrage scanners answer "are the prices wrong?" Vomit Elegy asks a
narrower question: "is there a portfolio whose minimum payout is guaranteed in
every admissible state, at executable depth, after fees?" If the answer needs a
hand-wave, it does not get logged.

The research write-up in `docs/research/niche-analysis.md` is blunt about why:
published full-universe recon found that apparent edges were almost always fee
illusions, shallow depth, or capital lockup. A scanner that emits those is noise.

## the first two adapters

- **MECNET** — in a mutually exclusive event, at most one market settles YES.
  Buying NO on `N` selected markets pays at least `N - 1` dollars per basket.
  The evaluator picks the most profitable fee-positive subset at displayed
  depth.
- **DIRECNET** — threshold implication. If `value > 60` implies `value > 50`,
  buying NO on the stronger claim and YES on the weaker one guarantees at least
  one payout.

The scan runs in two stages: screen the whole logical graph from fixed-point
snapshots, then verify the strongest events against fresh order books before
logging a signal.

## what it is not

Deliberately not a trading bot. There is no order placement, no keys, no
execution path. The vendored KalshiSharp SDK sits in `vendor/` reserved for a
later phase that may never come. What exists today is recon: an append-only
JSONL log of opportunities, near misses, scan coverage, and rejection counts —
plus a local read-only dashboard and a recorder that snapshots books for
replay.

Kalshi's historical API has markets, trades, and candlesticks but not
order-book depth, so backtests are explicitly theoretical quotes. The README
says so, which felt worth repeating here.

The bet is that the interesting artifact is not the trades — it is the
constraint-health dataset: where incoherence appears, how long it persists, and
why apparent opportunities fail.
