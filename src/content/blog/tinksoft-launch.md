---
title: "tinksoft.com is live"
date: 2026-06-10
description: "The tower gates open. A chronicle for the work, and the work it now tracks."
tags: [meta, tinksoft-site]
---

I build a lot of things. Lately I've been finishing more of them than I start,
which is new for me, and I wanted somewhere to write that down honestly. This
is that place.

## why a chronicle

Most project pages read like sales decks. But the part worth reading is the
middle: the rough edges, the rewrite I put off three months too long, the
afternoon the whole architecture finally clicked and I sat back grinning at the
screen. That middle part is what goes here.

The site itself follows a few hard rules. Every page is a single request to the
server, carries no JavaScript, and fits in a couple of kilobytes. Build small,
build sturdy.

## what's on the shelves

There's a [build log](/) for the running commentary, and a
[projects page](/projects) for the works themselves: the finished, the
in-progress, and the still-just-an-idea. Each one gets its own page with the
full story and every entry from the log that touches it.

Here's the current roster.

- **[SepulchrynScan](/projects/sepulchrynscan/)** — a fast port and service
  scanner written in Go. The first tool I reach for when I need to map out a
  network.
- **[Detectsmith](/projects/detectsmith/)** — a workbench for building security
  detections. It tries to be genuinely useful, not a second Splunk.
- **[CyberToolbox](/projects/cybertoolbox/)** — a whole belt of small security
  tools bundled into a single binary.
- **[Locket](/projects/locket/)** — a safe place for secrets, with a terminal
  interface clean enough that I open it daily.
- **[Shipnote](/projects/shipnote/)** — reads my git history and drafts the
  release notes so I don't have to. A small chore, handed off for good.
- **[Cleanpaste](/projects/cleanpaste/)** — a clipboard cleaner. It strips out
  the invisible junk that hitches a ride in copied text.
- **[Sigil](/projects/sigil/)** — finds secrets in your code and tucks them
  into Locket before git history can make them permanent.
- **[TPing](/projects/tping/)** — a watchtower for on-call shifts. It pings
  every store device and shows me who answered.
- **[PulpDescent](/projects/pulpdescent/)** and
  **[aGrandAdventure](/projects/agrandadventure/)** — two procedural text
  dungeons built in Godot 4, written without an LLM. No model writes a word of
  them. Every line is set by hand or grown from a grammar I wrote myself, and
  I'm stubbornly proud of that.

## what happens next

New entries go up as the work does, usually when something breaks, gets fixed,
or ships. There's an [RSS feed](/rss.xml) if that's how you like to read.
Otherwise, just check the [build log](/) whenever you remember to.
