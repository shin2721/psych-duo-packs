# Citation Trackability Report

> Generated: 2026-01-28

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | 13 |
| Citation Trackable | 0 (0.0%) |
| Not Trackable | 13 |

## Trackability Rules

- **TRACKABLE**: DOI or PMID or ISBN or URL のいずれか1つ以上が存在
- **book/classic**: DOI/PMID が無くても ISBN/URL でOK
- **peer_reviewed**: DOI/PMID を優先、無ければ公式URL
- **systematic/meta**: DOI必須（例外なし）

## Warning Details

❌ Found 13 evidence files without citation trackability:

### data/lessons/mental_units/mental_l01.evidence.json

**Basename:** mental_l01  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/mental_units/mental_l02.evidence.json

**Basename:** mental_l02  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/mental_units/mental_l03.evidence.json

**Basename:** mental_l03  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/mental_units/mental_l04.evidence.json

**Basename:** mental_l04  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/mental_units/mental_l05.evidence.json

**Basename:** mental_l05  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/mental_units/mental_l06.evidence.json

**Basename:** mental_l06  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/money_units/money_l01.evidence.json

**Basename:** money_l01  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/work_units/work_l01.evidence.json

**Basename:** work_l01  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/work_units/work_l02.evidence.json

**Basename:** work_l02  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/health_units/health_l01.evidence.json

**Basename:** health_l01  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/social_units/social_l01.evidence.json

**Basename:** social_l01  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/social_units/social_l02.evidence.json

**Basename:** social_l02  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---

### data/lessons/study_units/study_l01.evidence.json

**Basename:** study_l01  
**Source Type:** peer_reviewed  
**Issue:** No citation trackability: missing DOI, PMID, ISBN, and URL

---


## Recommended Actions

1. Review each warning above
2. Add appropriate citation information:
   - Academic papers: Add DOI or PMID
   - Books: Add ISBN or publisher URL
   - Web resources: Add official URL
3. Update evidence files and re-run this check

## Next Steps

```bash
# After adding citations, re-run check
npm run lint:trackability

# Run full preflight check
npm run content:preflight
```
