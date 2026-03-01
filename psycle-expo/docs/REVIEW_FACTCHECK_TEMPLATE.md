# Review Fact-Check Template

Use this template for any audit/review report that claims bugs, missing wiring, or regressions.

## 1) Scope
- Branch/Commit:
- Files reviewed:
- Runtime assumptions (env/device/build):

## 2) Findings Table (Mandatory)
| Severity | Claim | Evidence (file:line) | Confidence |
|---|---|---|---|
| P1/P2/P3 | Short statement | `/absolute/path/to/file.tsx:123` (+ optional second proof) | 0.00-1.00 |

Rules:
- `P0/P1` requires at least one concrete `file:line` proof.
- Integration claims require two proofs when possible:
  - caller proof and callee proof.
- If proof is incomplete, set status to `未確認` and lower severity.

## 3) Non-findings (Optional)
- Explicitly list checks performed that did not reproduce issues.

## 4) Commands Run (Mandatory)
```bash
npm run review:factcheck
rg -n "..." app/lesson.tsx lib/state.tsx
```

## 5) Conclusion
- Overall confidence:
- Blocking items:
- Follow-up items:
