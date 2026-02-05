# psycle-billing Submodule Runbook

## Purpose
Document how to work with the `psycle-billing` private submodule to avoid clone and CI failures.

## Current State
- `psycle-billing` is a private GitHub repo.
- The main repo tracks it as a submodule via `.gitmodules`.

## Preconditions
1. You have access to `shin2721/psycle-billing`.
2. Your GitHub credentials can read private repos.

## Local Clone
```bash
git submodule sync --recursive
git submodule update --init --recursive
```

## CI Requirements
1. The CI token must be able to read `shin2721/psycle-billing`.
2. If using GitHub Actions, ensure the token has access to that private repo.

## Common Failure
- Error: `No url found for submodule path 'psycle-billing' in .gitmodules`
  - Fix: ensure `.gitmodules` exists and includes the correct URL.
- Error: `repository not found` during checkout
  - Fix: provide a token with read access or adjust repo visibility.

## Change Policy
1. If the submodule URL changes, update `.gitmodules` and run `git submodule sync`.
2. Avoid converting to a normal directory without a migration plan.
