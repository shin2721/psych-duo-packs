# Bronze Assertion Warnings Report

> Generated: 2026-01-28

## Summary

| Metric | Value |
|--------|-------|
| Total Lessons Checked | 13 |
| Bronze Lessons | 0 |
| Assertion Warnings | 0 |

## Warning Details

✅ No assertion warnings found in bronze lessons.

## Recommended Actions

1. Review each warning above
2. Replace assertions with probability/tendency language:
   - "絶対" → "多くの場合"
   - "必ず" → "しばしば"
   - "確実に" → "可能性が高い"
   - "治る" → "改善する可能性がある"
   - "証明された" → "示唆されている"

3. Update lesson files and re-run this check
4. Consider upgrading evidence grade if stronger evidence is available

## Next Steps

```bash
# After fixing assertions, re-run check
npm run lint:bronze-assertions

# Validate all lessons
npm run validate:lessons
```
