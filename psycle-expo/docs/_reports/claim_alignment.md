# Claim Alignment Report

<<<<<<< HEAD
> Generated: 2026-02-03
=======
> Generated: 2026-01-28
>>>>>>> origin/メイン

## Summary

| Metric | Value |
|--------|-------|
| Total Lessons Checked | 13 |
| Alignment Warnings | 0 |
| Alignment Success Rate | 100.0% |

## Alignment Rules

- **Evidence必須**: 全レッスンにevidence fileが必要
- **Claim完全性**: claim, source_labelが空でないこと
- **Grade整合性**: Bronze evidenceで強い断定表現を使わない
- **Citation追跡性**: DOI/PMID/ISBN/URLのいずれか必須
- **Status整合性**: published statusは human_approved=true が必要

## Detailed Results

| Domain | Basename | Evidence | Issues | Status |
|--------|----------|----------|--------|--------|
| mental | mental_l01 | Y | None | ✅ OK |
| mental | mental_l02 | Y | None | ✅ OK |
| mental | mental_l03 | Y | None | ✅ OK |
| mental | mental_l04 | Y | None | ✅ OK |
| mental | mental_l05 | Y | None | ✅ OK |
| mental | mental_l06 | Y | None | ✅ OK |
| money | money_l01 | Y | None | ✅ OK |
| work | work_l01 | Y | None | ✅ OK |
| work | work_l02 | Y | None | ✅ OK |
| health | health_l01 | Y | None | ✅ OK |
| social | social_l01 | Y | None | ✅ OK |
| social | social_l02 | Y | None | ✅ OK |
| study | study_l01 | Y | None | ✅ OK |

## Alignment Issues Details

✅ No alignment issues found.

## Recommended Actions

1. Review alignment issues above
2. Ensure all lessons have evidence files
3. Fill in empty claim/source_label fields
4. Add trackable citations (DOI/PMID/ISBN/URL)
5. Review evidence grades vs lesson content strength
6. Approve evidence files (human_approved=true)

## Next Steps

```bash
# After fixing alignment issues, re-run check
npm run lint:claim-alignment

# Run full preflight check
npm run content:preflight
```
