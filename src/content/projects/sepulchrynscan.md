---
title: "SepulchrynScan"
status: shipped
description: "A multithreaded service-discovery and port scanner in Go. The scrying tool I reach for first."
started: 2025-09-01
repo: https://github.com/tinkthemaker/SepulchrynScan
tag: sepulchrynscan
---

The short version: I wanted a scanner that combines service fingerprinting,
banner grabbing, and host discovery in one binary, with sane defaults and
output that reads like a report instead of a wall of JSON. It knocks on
every door in the crypt and writes down what answered.

## goals

- One binary, no runtime dependencies
- Concurrent scanning that uses the bandwidth it's given
- Output shaped for what I do *next*, not for what nmap does
- Quiet by default. It speaks when it has something to say.

## current status

In active use. On internal networks I reach for it before nmap, because the
output is already shaped for the follow-up steps.
