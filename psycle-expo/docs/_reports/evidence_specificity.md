# Evidence Specificity Report

> Generated: 2026-01-27

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | 12 |
| Thin Evidence Warnings | 0 |
| Thin Evidence Rate | 0.0% |

## Specificity Rules

- **THIN WARNING**: claim < 40文字 または limitations < 60文字
- **推奨**: claim 40文字以上、limitations 60文字以上で具体性を確保

## Detailed Results

| Domain | Basename | Source Label | Claim Len | Limitations Len | Has Limitations | Trackable Type | Last Verified | Status | Warning |
|--------|----------|--------------|-----------|-----------------|-----------------|----------------|---------------|--------|---------|
| mental | mental_l01 | Y | 99 | 95 | Y | DOI,URL | 2026-01-24 | active | ✅ OK |
| mental | mental_l02 | Y | 88 | 121 | Y | ISBN,URL | 2026-01-27 | active | ✅ OK |
| mental | mental_l03 | Y | 45 | 102 | Y | DOI,URL | 2026-01-24 | reviewed | ✅ OK |
| mental | mental_l04 | Y | 70 | 107 | Y | DOI,PMID,URL | 2026-01-24 | reviewed | ✅ OK |
| mental | mental_l05 | Y | 92 | 127 | Y | DOI,PMID,URL | 2026-01-24 | active | ✅ OK |
| money | money_l01 | Y | 89 | 116 | Y | ISBN,URL | 2026-01-27 | active | ✅ OK |
| work | work_l01 | Y | 72 | 110 | Y | DOI,PMID,URL | 2026-01-27 | active | ✅ OK |
| work | work_l02 | Y | 78 | 106 | Y | DOI,PMID,URL | 2026-01-27 | active | ✅ OK |
| health | health_l01 | Y | 65 | 100 | Y | DOI,PMID,URL | 2026-01-27 | active | ✅ OK |
| social | social_l01 | Y | 90 | 138 | Y | ISBN,URL | 2026-01-27 | active | ✅ OK |
| social | social_l02 | Y | 103 | 103 | Y | ISBN,URL | 2026-01-27 | active | ✅ OK |
| study | study_l01 | Y | 98 | 108 | Y | DOI,PMID,URL | 2026-01-27 | active | ✅ OK |

## Thin Evidence Details

✅ No thin evidence warnings found.

## Recommended Actions

1. Review thin evidence cases above
2. Expand claim descriptions to 40+ characters
3. Expand limitations descriptions to 60+ characters
4. Ensure source_label is filled for all evidence

## Next Steps

```bash
# After improving evidence specificity, re-run check
npm run lint:evidence-specificity

# Run full preflight check
npm run content:preflight
```
