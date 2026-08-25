---
title: "Detectsmith"
status: shipped
description: "Tests detection rules against local logs and JSONL streams."
started: 2025-11-15
repo: https://github.com/tinkthemaker/Detectsmith
tag: detectsmith
---

Detectsmith tests detection rules against real log data before they are moved
into a SIEM. It runs locally against log files and JSONL streams and produces
output suitable for tickets and review.

## goals

- Local-first: runs against log files and JSONL streams, no agent
- A rule library that's curated, not scraped
- Output I can paste straight into a ticket

## current status

Shipped and in use. I add detection packs as I need them.
