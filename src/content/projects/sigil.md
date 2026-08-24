---
title: "Sigil"
status: shipped
description: "Finds secrets in your code and moves them into Locket before git history makes them permanent."
started: 2026-02-01
repo: https://github.com/tinkthemaker/sigil
tag: sigil
---

Secrets discovery and remediation. Sigil scans a repo for the credentials
that shouldn't be there: AWS keys, GitHub tokens, API keys, private keys,
bearer tokens. Findings are always shown masked, and from the TUI each one
can be moved straight into [Locket](/projects/locket/), my secrets vault.
A pre-commit hook stands guard so new ones never reach git in the first
place.

The name is older than the scope. It started as a sketch for an
artifact-signing tool, and the secrets scanner is what it grew into. The
wax-seal ambition might return someday. The scanner earns its keep now.

## goals

- Find secrets before git history makes them permanent
- Remediate, don't just report: a finding can go straight into Locket
- Mask everything. A scanner that prints secrets is a leak with extra steps.
- One binary, a pre-commit hook, reports in JSON or markdown

## current status

Shipped and growing. The pre-commit hook guards every repo on this site.
