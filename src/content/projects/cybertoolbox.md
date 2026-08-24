---
title: "CyberToolbox"
status: shipped
description: "A belt of security cantrips bound into one binary."
started: 2025-08-10
repo: https://github.com/tinkthemaker/CyberToolbox
tag: cybertoolbox
---

A belt of security cantrips packaged as one binary with subcommands. The
admission rule: would I install this on a fresh box to do a specific job, or
would I just `curl | sh` something off the internet? If the second, it gets
bound into the belt instead.

## goals

- Subcommands, not a monolith
- No daemon, no config file, no telemetry
- Output that pipes cleanly into other tools

## current status

Shipped. It grows whenever I catch myself doing a task by hand for the
third time.
