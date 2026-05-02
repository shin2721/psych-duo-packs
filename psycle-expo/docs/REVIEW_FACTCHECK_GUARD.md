# Review Fact-Check Guard

This guard is mandatory before publishing any high-severity review claim about Psycle.

Run the fact-check script from the Psycle app root:

```bash
npm run review:factcheck
```

Use this guard before asserting any `P0` / `P1` issue, or before writing that something is "未実装", "未接続", or "壊れている".

Rules:

- Do not publish `P0` / `P1` without explicit `file:line` evidence.
- If evidence is incomplete, mark the claim as `未確認` instead of confirmed.
- For integration issues, collect at least two evidence points:
  - caller side, such as the UI or entrypoint
  - callee side, such as the state, library, or function
- Use `docs/REVIEW_FACTCHECK_TEMPLATE.md` for review output.
- If script checks fail, report the failure first and stop conclusion writing.
