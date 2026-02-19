# Workflow Ownership

This repo intentionally separates validation, scheduled publish, and manual publish to avoid duplicate publish paths.

| Workflow file | Trigger(s) | Responsibility |
| --- | --- | --- |
| `ci-tests.yml` | `pull_request`, `push` (`main` only), `workflow_dispatch` | Test, web smoke, and content quality checks |
| `validate-packs.yml` | `pull_request`, `push` (`main` only) | Catalog/pack validation only |
| `auto-publish.yml` | `workflow_dispatch` | **Paused** (publish pipeline migration in progress) |
| `publish-manual.yml` | `workflow_dispatch` | **Paused** (publish pipeline migration in progress) |
| `content-generation.yml` | `schedule`, `workflow_dispatch` | Autonomous content generation |

## Publish Workflow Status

- `auto-publish.yml` and `publish-manual.yml` are intentionally paused.
- Reason: legacy scripts/references were stale and could run unsafe paths.
- These workflows should remain paused until the new publish pipeline is introduced.

## Runbooks

- Content generation: `RUNBOOK_CONTENT_GENERATION.md`
- i18n: `../docs/RUNBOOK_I18N.md`
- psycle-billing submodule: `../docs/RUNBOOK_SUBMODULE_PSYCLE_BILLING.md`
- Pages re-enable decision: `../docs/PAGES_REENABLE_DECISION.md`
- Release smoke test: `../docs/RUNBOOK_RELEASE_SMOKE_TEST.md`
- i18n quality review: `../docs/RUNBOOK_I18N_QUALITY_REVIEW.md`
