# Content Generation Runbook

## Purpose
Run the Autonomous Content Generation workflow in a repeatable, low-risk way and produce a PR with generated lesson content.

## Workflow Location
- Workflow file: `.github/workflows/content-generation.yml`
- Script entrypoint: `psycle-expo/scripts/autonomous_pipeline.js`

## Preconditions
1. Repository Actions are enabled.
2. Secret `GEMINI_API_KEY` is set in the repo.
3. You are ready to review a generated PR before merging.

## Manual Run Steps
1. Go to GitHub Actions.
2. Select `Autonomous Content Generation`.
3. Click `Run workflow`.
4. Branch: `main`.
5. Input `genre` with an explicit value like `Mental`.
6. Start the run and wait for completion. Expect a long run time.

## Expected Outputs
1. A new branch named `auto-content/<genre-lower>-YYYYMMDD`.
2. A PR titled `🤖 Auto-generated content: <Genre> (YYYY-MM-DD)`.
3. Generated or updated files:
   - `psycle-expo/data/curriculum_<Genre>.json`
   - `psycle-expo/data/lessons/<genre>_generated_full.json`
   - `psycle-expo/data/lessons/<genre>.json`
   - `psycle-expo/data/lessons/<genre>_backup.json`
   - `psycle-expo/data/pipeline_report_<genre>.json`

## Review Checklist Before Merge
1. Check the PR runs are green.
2. Open `psycle-expo/data/pipeline_report_<genre>.json` and review the quality summary.
3. Spot-check a few entries in `psycle-expo/data/lessons/<genre>.json`.
4. Merge the PR only if quality is acceptable.

## Common Failures and Fixes
1. Missing secret `GEMINI_API_KEY`.
   - Fix: Add the secret in repo settings and rerun.
2. Quality threshold not met.
   - Fix: Review the report, adjust inputs or data sources, rerun.
3. PR creation fails.
   - Fix: Ensure Actions permissions allow `pull-requests: write` and repo settings permit PR creation.

## Operational Notes
1. Concurrency is enforced. If a run is in progress, new runs will queue.
2. Cancel a run from the Actions UI if it is no longer needed.
