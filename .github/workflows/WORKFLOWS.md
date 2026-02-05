# Workflow Ownership

This repo intentionally separates validation, scheduled publish, and manual publish to avoid duplicate publish paths.

| Workflow file | Trigger(s) | Responsibility |
| --- | --- | --- |
| `ci-tests.yml` | `pull_request`, `push` (`main` only), `workflow_dispatch` | Test and content quality checks |
| `validate-packs.yml` | `pull_request`, `push` (`main` only) | Catalog/pack validation only |
| `auto-publish.yml` | `schedule` | Weekly automatic publish from queue |
| `publish-manual.yml` | `workflow_dispatch` | On-demand manual publish |
| `content-generation.yml` | `schedule`, `workflow_dispatch` | Autonomous content generation |

## Runbooks

- Content generation: `RUNBOOK_CONTENT_GENERATION.md`
- i18n: `../docs/RUNBOOK_I18N.md`
- psycle-billing submodule: `../docs/RUNBOOK_SUBMODULE_PSYCLE_BILLING.md`
- Pages re-enable decision: `../docs/PAGES_REENABLE_DECISION.md`
- Release smoke test: `../docs/RUNBOOK_RELEASE_SMOKE_TEST.md`
