# i18n Runbook

## Purpose
Standardize the workflow for adding or updating localized lesson files so index files and validation stay consistent.

## Related Docs
- `docs/I18N_STYLE_GUIDE.md`
- `docs/RUNBOOK_I18N_LANGUAGE_LAUNCH.md`

## Scope
This runbook covers lesson JSON files under `psycle-expo/data/lessons/**` and the locale index/validation scripts.

## Preconditions
1. You have a clean working tree.
2. You know which unit and lesson IDs you are updating.
3. You can run Node scripts locally.

## Add or Update Lesson Locales
1. Add or update the lesson JSON files.
2. Regenerate locale indices.
3. Validate locale coverage.
4. Commit only the intended files.

## Commands
```bash
cd psycle-expo
node scripts/gen-lesson-locale-index.js
node scripts/validate-lesson-locales.js --check
cd ..
```

## Files Typically Changed
- `psycle-expo/data/lessons/<unit>_units/<lesson>.ja.json`
- `psycle-expo/data/lessons/<unit>_units/<lesson>.en.json`
- `psycle-expo/data/lessons/<unit>_units/index.ts`

## Review Checklist
1. Locale validation passes.
2. New `index.ts` changes align with the files you added.
3. No unrelated lesson files changed.

## Common Failures
1. Validation fails due to missing locale.
   - Fix: add the missing locale file and re-run the scripts.
2. Index files missing updates.
   - Fix: re-run `gen-lesson-locale-index.js` and commit the updated index files.

## Policy
1. Use `fail-on-new` as the default CI gate for glossary lint.
2. Move to strict mode only after consecutive stable PRs for the target language.
