---
title: "TPing"
status: shipped
description: "A watchtower for on-call. Sends ravens to every store device and shows who answered."
started: 2025-07-15
repo: https://github.com/tinkthemaker/TPing
tag: tping
---

A watchtower for on-call shifts. I needed to open one window and see every
store device, whether it answered, and how fast. A spreadsheet of `ping`
output wasn't cutting it. TPing sends the ravens, keeps the history, and
shows the whole field at a glance. Bubble Tea TUI for me, a Walk GUI for
the rest of the team.

## goals

- Scan accuracy over visual polish
- Reach the intended target, not just the nearest hop
- A history view that can explain an outage after the fact

## current status

Shipped and used on rotation. The TUI is mine. The GUI keeps everyone else
happy.
