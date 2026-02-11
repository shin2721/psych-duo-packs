# i18n New-Language Launch Runbook

## Purpose
Standardize quality checks when adding a new lesson language (for example `es`, `zh`, `ko`).

## Scope
- Lesson locale files in `psycle-expo/data/lessons/**`.
- Applies to first rollout of each language.

## Step 1: Structural Gate (Required)
```bash
cd psycle-expo
node scripts/gen-lesson-locale-index.js
node scripts/validate-lesson-locales.js --check
node scripts/lint-locale-json-purity.js --langs=<target_lang>
node scripts/lint-translation-glossary.js --lang=<target_lang> --fail-on-new
```

## Step 2: Sample Review Gate (Required for first rollout)
Review 20 items total:
1. 10 items with psychology terms.
2. 10 items with hedging / uncertainty wording.

For each sampled item, verify:
1. Meaning fidelity to JA source.
2. Hedging strength is preserved (not stronger than source).
3. Tone is natural and supportive.

## Step 3: Record and Fix
If issues are found, fix in the same PR or a follow-up PR before merge.

PR description must include:
1. Sampled lesson IDs / item IDs.
2. Number of issues found.
3. Confirmation that gates passed.

## Step 4: Baseline Update Policy
Update glossary baseline only after:
1. Structural gate passes.
2. Sample review gate is completed.
3. Remaining warnings are accepted intentionally.
