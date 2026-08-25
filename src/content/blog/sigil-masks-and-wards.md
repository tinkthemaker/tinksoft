---
title: "sigil: interface and scanner fixes"
date: 2026-06-10
description: "A new terminal interface, consistent masking, and fixes to the pre-commit path."
tags: [sigil]
---

Sigil grew from about 770 lines to 1,900. Most of the work was in the interface
and scanner behavior.

## interface

The new terminal interface has four screens:

- scan progress
- editable search paths
- findings with a detail panel
- review and transfer to [Locket](/projects/locket/)

The previous review flow removed a finding from the screen without calling
Locket. That path was deleted. The current flow performs the transfer.

## masking

All findings now pass through one `Masked()` function before reaching the
terminal, interface, JSON report, or markdown report. Raw secret values are not
printed.

## scanner changes

- `.gitignore` rules are applied using a parser built on the Go standard library
- binary files, lockfiles, and `_test.go` files are skipped
- the scanner uses a 1 MB line buffer for minified files
- AWS-key detection now requires AWS context and ignores `go.sum` hashes

## fixes

The `--exit-code` flag parsed correctly but did not affect the process exit
status. This prevented the pre-commit hook from blocking commits. It now exits
non-zero when findings are present.

The Locket command path also had a quote-injection bug. Arguments are now passed
without shell interpolation.

Tests cover the Locket client, report formats, gitignore parser, and terminal
interface. Generated binaries and stale reports were removed from the repo.
