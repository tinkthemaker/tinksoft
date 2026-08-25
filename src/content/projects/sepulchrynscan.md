---
title: "SepulchrynScan"
status: shipped
description: "A concurrent service-discovery and port scanner written in Go."
started: 2025-09-01
repo: https://github.com/tinkthemaker/SepulchrynScan
tag: sepulchrynscan
---

SepulchrynScan combines host discovery, port scanning, banner grabbing, and
service fingerprinting in one binary. The default output is intended to be
read directly and used for follow-up work.

## goals

- One binary, no runtime dependencies
- Concurrent scanning that uses the bandwidth it's given
- Output shaped for what I do *next*, not for what nmap does
- Quiet by default. It speaks when it has something to say.

## current status

In active use. On internal networks I reach for it before nmap, because the
output is already shaped for the follow-up steps.
