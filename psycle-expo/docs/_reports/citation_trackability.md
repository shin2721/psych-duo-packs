# Citation Trackability Report

> Generated: 2026-01-27

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | 13 |
| Citation Trackable | 13 (100.0%) |
| Not Trackable | 0 |

## Trackability Rules

- **TRACKABLE**: DOI or PMID or ISBN or URL のいずれか1つ以上が存在
- **book/classic**: DOI/PMID が無くても ISBN/URL でOK
- **peer_reviewed**: DOI/PMID を優先、無ければ公式URL
- **systematic/meta**: DOI必須（例外なし）

## Warning Details

✅ All evidence files have citation trackability.

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
