---
title: "tping: comparing three Windows frontends"
date: 2026-06-11
description: "Walk, Dear ImGui, and Direct2D tested for a compact monitoring window."
tags: [tping]
---

TPing displays 23 store devices in one compact monitoring window. I tested
three Windows frontend approaches to reduce the window size without hiding
rows or adding a scrollbar.

## what I tried

### Walk

The Walk version uses native Windows controls. It is pure Go, 9.3 MB, and builds
in under a second. The native list control adds row spacing that cannot be
removed through the available style and spacing flags.

### Dear ImGui

The ImGui version uses Cgo and `github.com/AllenDang/cimgui-go`. The binary is
14.7 MB and statically linked. It runs at 30 FPS while active, 5 FPS while idle,
and 2 FPS while minimized. A scratch buffer, pushed IDs, and cached text sizes
reduce each frame to one slice allocation and no string formatting.

This is the production frontend.

### Direct2D

The Direct2D version uses a Cgo wrapper around the COM interfaces. It creates
the factory, render target, brush, text format, and window procedure directly.
The window renders and handles input, but resizing leaves the render target at
the original dimensions.

Fixing resize correctly requires either swap-chain management through
`ID2D1DeviceContext` or reliable render-target recreation. That work is not
finished. The Direct2D package remains in the tree as an experiment.

## result

Walk remains the simplest build. ImGui provides the smallest usable window and
is the version I run. Direct2D is not used in production.
