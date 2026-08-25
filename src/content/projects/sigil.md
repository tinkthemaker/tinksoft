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
A pre-commit hook blocks new findings before they reach git.

The project started as an artifact-signing tool. The secrets scanner became
the useful part, so that is now the focus.

## goals

- Find secrets before git history makes them permanent
- Remediate, don't just report: a finding can go straight into Locket
- Mask everything. A scanner that prints secrets is a leak with extra steps.
- One binary, a pre-commit hook, reports in JSON or markdown

## current status

Shipped and in use. The pre-commit hook runs on my repositories.
