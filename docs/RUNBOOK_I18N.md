# i18n Runbook

## Purpose
Standardize the workflow for generated lesson locales so index files and validation stay consistent.

## Locale Policy
- `ja` is the only hand-written locale (source). Every other locale is generated from `ja` and is never hand-edited.
- What the generators cover today: `npm run content:i18n:draft -- --lang=<xx>` produces the lesson JSON (`data/lessons/**/<lesson>.<xx>.json`) only. The UI strings file `lib/locales/<xx>.ts` has **no generator yet**; until one exists, a locale cannot be activated (the UI lint fails on an active locale without that file).
- `psycle-expo/config/locales.json` lists the `active` locales. CI validates active locales strictly (a missing file is an error); a locale that has files but is not active is validated too; a target locale with no files is reported as `not generated`, not as an error.
- Activating a generated locale (all five steps, in this order):
  1. Generate the lesson files (`content:i18n:draft`) and the UI strings file `lib/locales/<xx>.ts`.
  2. Run the gates below (`validate-lesson-locales --check`, `lint-locale-json-purity --langs=<xx>`, `lint-translation-glossary --lang=<xx>`, `i18n:report`).
  3. Add `<xx>` to `active` in `config/locales.json`.
  4. Register it in `lib/i18n.ts` (import + `new I18n({ ja, <xx> })`).
  5. Regenerate the unit index files (`npm run content:i18n:gen`) and commit them; then update the smoke fallback case in `scripts/e2e-web-smoke.mjs`.

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
- `psycle-expo/data/lessons/<unit>_units/<lesson>.ja.json` (hand-written source)
- `psycle-expo/data/lessons/<unit>_units/<lesson>.<xx>.json` (generated; only for active locales)
- `psycle-expo/data/lessons/<unit>_units/index.ts` (generated)

## Review Checklist
1. Locale validation passes.
2. New `index.ts` changes align with the files you added.
3. No unrelated lesson files changed.

## Common Failures
1. Validation reports `[xx] not generated`.
   - Not a failure: the locale is not active. Generate it from `ja` when you want to activate it.
   - If the locale IS active and a lesson is missing, regenerate that locale from `ja`.
2. Index files missing updates.
   - Fix: re-run `gen-lesson-locale-index.js` and commit the updated index files.

## Policy
1. Use `fail-on-new` as the default CI gate for glossary lint.
2. Move to strict mode only after consecutive stable PRs for the target language.
