# Claim Alignment Report

> Generated: 2026-01-28

## Summary

| Metric | Value |
|--------|-------|
| Total Lessons Checked | 13 |
| Alignment Warnings | 13 |
| Alignment Success Rate | 0.0% |

## Alignment Rules

- **Evidence必須**: 全レッスンにevidence fileが必要
- **Claim完全性**: claim, source_labelが空でないこと
- **Grade整合性**: Bronze evidenceで強い断定表現を使わない
- **Citation追跡性**: DOI/PMID/ISBN/URLのいずれか必須
- **Status整合性**: published statusは human_approved=true が必要

## Detailed Results

| Domain | Basename | Evidence | Issues | Status |
|--------|----------|----------|--------|--------|
| mental | mental_l01 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| mental | mental_l02 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| mental | mental_l03 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| mental | mental_l04 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| mental | mental_l05 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| mental | mental_l06 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| money | money_l01 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| work | work_l01 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| work | work_l02 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| health | health_l01 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| social | social_l01 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| social | social_l02 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |
| study | study_l01 | Y | No trackable citation (DOI/PMID/ISBN/URL) | ⚠️ WARNING |

## Alignment Issues Details

⚠️ Found 13 lessons with alignment issues:

### mental/mental_l01

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### mental/mental_l02

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### mental/mental_l03

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### mental/mental_l04

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### mental/mental_l05

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### mental/mental_l06

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### money/money_l01

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### work/work_l01

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### work/work_l02

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### health/health_l01

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### social/social_l01

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### social/social_l02

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---

### study/study_l01

**Issues:**
- No trackable citation (DOI/PMID/ISBN/URL)

---


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
