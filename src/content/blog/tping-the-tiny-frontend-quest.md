---
title: "tping: the tiny frontend quest"
date: 2026-06-11
description: "Three frontends, two dead ends, one stubborn number. The imgui build is what you ship today."
tags: [tping]
---

I had a tiny window that watched 23 store devices, and it worked. That should
have been the end of it. But a number got into my head and would not leave: the
size of that window, in pixels. Twenty-three rows of IP addresses, every one
visible, no scrollbar, packed into the smallest rectangle I could manage. A
tool window at 7pt font, built with `WS_EX_TOOLWINDOW` (a Windows flag that
strips the title bar down to a thin sliver). Honest work. I was proud of it
right up until I wasn't.

Then MiniMax suggested Dear ImGui, an open-source, game-style drawing library,
and I rebuilt the same window in it. The same 23 devices fit in a noticeably
tighter box, barely any wider but dramatically shorter. This window drew itself
from scratch: no Windows chrome tax, no `SysListView32` (Windows' built-in row
list, the thing that wedges a tiny, unavoidable gap between rows) to argue
with.

Something about watching all that wasted height vanish lit a fuse in me. I
should have talked myself out of it faster. I did not.

## what I tried

Three frontends live in the tree now.

The Walk build (Walk is a Go toolkit that wraps Windows' built-in window
controls) is the conservative one. Pure Go, 9.3 MB, builds in under a second,
and runs anywhere a Walk binary runs, including ancient PCs.

The ImGui build is the dense one. It leans on Cgo (a Go feature that lets Go
call into C libraries) and Dear ImGui through `github.com/AllenDang/cimgui-go`,
comes in at 14.7 MB, and is statically linked so it doesn't drag MinGW DLLs
around behind it. It has an adaptive frame rate now: 30 frames a second when
active, 5 when idle, 2 when minimized. Add a scratch buffer, pushed IDs, and a
cached `CalcTextSize`, and the per-frame allocation comes down to one slice and
zero string formats. This is the build I run on shift. I like it the way you
like a tool you sharpened yourself.

The third frontend is a Direct2D experiment. Direct2D is Windows' built-in 2D
drawing engine, the thing that paints pixels to the screen. This one is a Cgo
shim into the COM vtables (a way of calling into Windows' component system from
Go), with a D2D factory, a DWrite text format, and a wndproc that draws every
pixel by hand. The package compiles. The test passes. The binary launches,
opens a small window up in the corner of the screen, draws a control strip and a label area,
and respects double-click, the R and G keys, and the topmost flag. It is the
first frontend I have ever written where I owned the entire paint.

It was horrible. I spun MiniMax out completely on this one. Twice. That is a
LOT of tokens blasted into the abyss to chase a couple of pixels. I do not know why I
kept going as long as I did. Actually I do. I wanted the pixels to obey me, and
they almost did, and "almost" is the most expensive word in this hobby.

## the number that wouldn't move

The Walk build carries a tax I could not shake. Windows' built-in row list
insists on a couple of pixels of padding between every row, and no theme flag,
no `LVS_OWNERDRAWFIXED`, no `LVM_SETITEMSPACING` would let me strip it out. I
measured the real scroll values against the client area and worked through the
math, and the rows simply refuse to divide evenly into the space. The
arithmetic is what it is. You can be furious at arithmetic, but it doesn't
care.

So I killed the theme, set the background to a flat `RGB(245, 245, 245)`,
accepted the gap, and made it look like I meant it. Then I went after Direct2D
anyway, because Direct2D has no list view at all. Direct2D is a paintbrush. A
paintbrush draws exactly the pixels you tell it to, and that promise was too
pretty to leave alone.

## the wall I hit

I told Direct2D to redraw at the new window size. It drew to the old one. I
poked a different corner of the API, the place where the factory is supposed to
hand me a resized drawing target, and it crashed outright. The window resizes
just fine. The paint stops at the original rectangle and the rest stays black.
A little dead zone, sitting there mocking me.

The honest fixes are all big. One path drops down into a lower-level API called
`ID2D1DeviceContext` and hand-rolls a swap chain (the underlying buffer that
talks to the graphics card), roughly 500 lines of swap-chain management.
Another waits for a specific error code at the end of every frame, then tears
the whole drawing target down and rebuilds it, which is what production
Direct2D apps do, and which I could not make stable inside one evening. The
last option falls back to GDI (Windows' older drawing system) for the resize
case, which would mean admitting the question in the title was wrong.

None of those fit into a few more hours. Each one is a day or two of focused
work. And I would rather ship the thing I have than keep feeding tokens to a
window that paints itself wrong out of spite.

## the state of the tree

Three binaries in the tree now. Walk, for that retro feel. ImGui, for me.
Direct2D, preserved for whoever wants to pick up the resize thread. The
Direct2D package is a genuinely working Cgo COM layer: factory, render target,
brush, text format, every vtable index checked against the MinGW `d2d1.h`. It's
real, and it's reusable. The next person won't have to relearn the calling
convention from scratch, and I hope they read this first and budget two days
instead of one evening.

ImGui stays the production build, after much pain and suffering. The Direct2D
code sits in the tree like an unfinished miniature on the painting desk. The
foundation is sound. Some future version of me with a free weekend will finish
the resize story, or some future stranger will, and honestly either one is fine
by me.
