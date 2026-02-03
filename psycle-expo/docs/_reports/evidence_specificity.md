# Evidence Specificity Report

> Generated: 2026-02-03

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | 13 |
| Thin Evidence Warnings | 1 |
| Thin Evidence Rate | 7.7% |

## Specificity Rules

- **THIN WARNING**: claim < 40文字 または limitations < 60文字
- **推奨**: claim 40文字以上、limitations 60文字以上で具体性を確保

## Detailed Results

| Domain | Basename | Source Label | Claim Len | Limitations Len | Has Limitations | Trackable Type | Last Verified | Status | Warning |
|--------|----------|--------------|-----------|-----------------|-----------------|----------------|---------------|--------|---------|
| mental | mental_l01 | Y | 95 | 79 | Y | NONE | 2026-01-28 | active | ✅ OK |
| mental | mental_l02 | Y | 85 | 77 | Y | NONE | 2026-01-28 | active | ✅ OK |
| mental | mental_l03 | Y | 73 | 55 | Y | NONE | 2026-01-28 | active | ⚠️ THIN |
| mental | mental_l04 | Y | 95 | 74 | Y | NONE | 2026-01-28 | active | ✅ OK |
| mental | mental_l05 | Y | 71 | 84 | Y | NONE | 2026-01-28 | active | ✅ OK |
| mental | mental_l06 | Y | 85 | 85 | Y | NONE | 2026-01-28 | active | ✅ OK |
| money | money_l01 | Y | 97 | 64 | Y | NONE | 2026-01-28 | active | ✅ OK |
| work | work_l01 | Y | 80 | 77 | Y | NONE | 2026-01-28 | active | ✅ OK |
| work | work_l02 | Y | 96 | 75 | Y | NONE | 2026-01-28 | active | ✅ OK |
| health | health_l01 | Y | 78 | 109 | Y | NONE | 2026-01-29 | active | ✅ OK |
| social | social_l01 | Y | 94 | 105 | Y | NONE | 2026-01-29 | active | ✅ OK |
| social | social_l02 | Y | 86 | 88 | Y | NONE | 2026-01-29 | active | ✅ OK |
| study | study_l01 | Y | 83 | 74 | Y | NONE | 2026-01-28 | active | ✅ OK |

## Thin Evidence Details

⚠️ Found 1 thin evidence cases:

### mental/mental_l03

**Claim Length:** 73 (推奨: 40+)  
**Limitations Length:** 55 (推奨: 60+)  
**Issue:**  Limitations too short

---


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
