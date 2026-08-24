---
title: "sigil: masks, wards, and one polite no-op"
date: 2026-06-10
description: "The interface grew four screens, secrets got masked everywhere, and two embarrassing bugs came out by the root."
tags: [sigil]
---

Sigil nearly doubled this week, from about 770 lines to 1,900, and almost all
of the new weight landed in the parts you touch.

If you haven't met it yet: Sigil is my secret scanner. It reads through a
codebase looking for things that should never have been committed, the API
keys and passwords and tokens, and hands them to [Locket](/projects/locket/),
my password manager, before git history makes them permanent.

## a real interface, finally

Until now you drove all of that from the command line. This week it grew a
proper TUI, a text-based interface you navigate right inside the terminal, and
it's the change I'm happiest about. Four screens now, each one shaped like a
step of the real job. A spinner while the scan runs. An editable list of paths
to search. A scrollable list of findings with a detail panel beside it. Small
pop-up notices, "toasts," when something happens. And the review screen calls
Locket for real.

That last part is the whole point, and chasing it down turned up something I'm
not proud of. The old interface had a flow that looked like it removed a
finding but never called Locket. It just cleared the row off the screen and
moved on, pleased with itself. Code that pretends to do the dangerous part is
worse than no code at all. I deleted it without ceremony.

## masks everywhere

A secret scanner that prints secrets in plaintext is just a leak with extra
steps. So every finding now passes through a single `Masked()` function before
it reaches any surface: the command line, the new interface, both report
formats. There is no longer a path where a raw secret can slip out the side,
and I sleep a little better for it.

## the scanner got wiser

The scan itself learned some manners, too. It reads your `.gitignore` and skips
the same files git would, using a small parser I built on Go's standard library
with no outside dependencies. It sniffs out binary files, lockfiles, and Go's
own `_test.go` files and leaves them alone. And it carries a 1MB line buffer
for the minified files that have no business being a single line and somehow
always are.

## two bugs I'm glad are dead

The first one stings, and I'll just say it plainly. Sigil has an `--exit-code`
flag that is supposed to make it fail loudly when it finds a secret. That
failure is how the pre-commit hook, the script git runs before it lets a commit
through, knows to stop you. The flag parsed without complaint and then did
nothing at all. Nothing. Which means the hook has been waving every commit
through since the day I wrote it. Every commit it "checked" sailed right past —
and I never knew. It works now, along with proper `--fix`, `--version`, and
`--help`.

The second is worse, and it embarrassed me more. There was a quote-injection
bug in the code that calls out to Locket. Hand it a stray quote character and
you could make it run a command I never intended. A tool whose entire job is
guarding secrets should not have a hole like that. It is a special kind of
shame, and it kept me up until it was patched.

Honorable mention goes to the AWS-key detector. It used to flag every hash in
`go.sum`, Go's dependency lockfile, which is wall-to-wall long random-looking
strings. It cried wolf so often that I trained myself to ignore it, which is
the worst thing a security alert can ever do to you. It waits for real AWS
context now before it says a word. An alarm that always rings is just
furniture.

## housekeeping

Tests landed for the Locket client, both report formats, the gitignore parser,
and the new interface. The repo finally got a real `.gitignore` and an MIT
license. And the compiled `sigil.exe`, two stale reports, and a forgotten
`test_config.py` are gone for good, because compiled binaries belong in
releases, not in git history.

All tests green. Sigil scanned itself and came back clean. That part felt good.
