# Evidence Grade Inflation Report

> Generated: 2026-02-03

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | 13 |
| Gold Inflation Warnings | 0 |

## Inflation Detection Rules

- **WARNING**: `source_type` が "book" または "classic" で `evidence_grade` が "gold" の場合
- **理由**: 書籍や古典的研究は通常 Silver 以下が適切

## Warning Details

✅ No gold inflation warnings found.

## Recommended Actions

1. Review each warning above
2. Consider downgrading evidence grade:
   - Book sources: Usually Silver or Bronze
   - Classic studies: Usually Silver (unless meta-analysis)
3. Update evidence files and re-run this check

## Next Steps

```bash
# After fixing inflation, re-run check
npm run lint:evidence-grade

# Run full preflight check
npm run content:preflight
```
