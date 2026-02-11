# i18n Style Guide

## Purpose
Keep translation quality consistent across all lesson locales.

## Tone and Voice
1. Use warm, supportive, non-judgmental wording.
2. Avoid moralizing or blaming language.
3. Prefer short, clear sentences over complex phrasing.

## Hedging Policy (Critical)
When JA source contains uncertainty, target language must preserve uncertainty.

Examples:
- JA: `傾向がある` -> use equivalents of `tends to`.
- JA: `可能性がある` / `かもしれない` -> use equivalents of `may / might / could`.
- JA: `報告されている` -> use equivalents of `has been reported / studies show`.

Do not strengthen into deterministic claims.

## Banned Style
Avoid absolute / over-assertive wording:
- "always works"
- "guaranteed"
- "proven to"
- hard 100% claims unless source explicitly states that

## Terminology Consistency
Use glossary-consistent wording for recurring psychology terms.

Minimum required terms:
- rumination
- cognitive appraisal
- implementation intention / If-Then plan
- procrastination
- cognitive arousal
- reappraisal

## Do Not Translate / Structure Rules
1. Keep JSON structure and IDs unchanged.
2. Keep `claim_tags` in English.
3. Do not alter `correct_index`, `recommended_index`, `xp`, `difficulty`, or evidence metadata unless source changes.

## Quality Gate
Run before opening PR:

```bash
cd psycle-expo
npm run content:i18n:check
npm run content:i18n:glossary -- --lang=<target>
```
