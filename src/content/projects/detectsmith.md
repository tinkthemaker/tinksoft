---
title: "Detectsmith"
status: shipped
description: "A smithy for detection wards. Tries to be useful, not Splunk."
started: 2025-11-15
repo: https://github.com/tinkthemaker/Detectsmith
tag: detectsmith
---

A smithy for detection wards. I built it while working through
detection-engineering problems, annoyed at the gap between "write a Sigma
rule" and "watch it work in a SIEM." Detectsmith lives in that gap. You
forge the ward against real logs, and only hang it once it catches what it
should.

## goals

- Local-first: runs against log files and JSONL streams, no agent
- A rule library that's curated, not scraped
- Output I can paste straight into a ticket

## current status

Shipped and used. Detection packs for specific attacker TTPs get added as I
forge them.
