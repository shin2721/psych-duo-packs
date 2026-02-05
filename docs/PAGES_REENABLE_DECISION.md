# Pages Re-enable Decision

## Purpose
Capture the decision path for re-enabling GitHub Pages without reintroducing CI noise.

## Current Status
- Pages is disabled.
- The previous failure was caused by the private `psycle-billing` submodule.

## Decision Options
1. Keep Pages disabled.
2. Re-enable Pages using a custom Actions deploy that can access private submodules.
3. Re-enable Pages after making `psycle-billing` public.

## Recommended Path
Use a custom Actions deploy with a read token for private submodules. This avoids changing repo visibility.

## Notes
- If Pages is re-enabled, set the source branch to `main` and confirm deployments are green.
- Avoid enabling Pages without a validated deploy workflow.
