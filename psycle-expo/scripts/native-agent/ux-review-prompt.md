# UX Review — Execution Constraints

Use the native UX agent as the control surface only.

## Hard rules

- Do not attach screenshots into chat.
- Do not narrate actions step by step.
- Do not output "analyzed screenshot" or "viewed screenshot" style logs.
- Operate first, collect observations silently, then output findings only.
- If testIDs are missing, report that as an **automation finding**, not a UX finding.
- Do not substitute screenshot narration for missing testIDs.
- If you violate any of the above rules, stop and restart the evaluation in the correct format.

## Available commands

Control the app via file-based IPC only:

| CLI script     | Action            |
|----------------|-------------------|
| `ux:tap`       | Tap by testID     |
| `ux:tap-text`  | Tap by text       |
| `ux:scroll`    | Scroll container  |
| `ux:scroll-to` | Scroll until target visible |
| `ux:swipe`     | Swipe gesture     |
| `ux:type`      | Type into input   |
| `ux:visible`   | Check visibility  |
| `ux:dump-ids`  | Batch check IDs   |
| `ux:open-url`  | Deep link          |
| `ux:screenshot`| Save to disk only |
| `ux:wait-for`  | Wait for element  |

Screenshots are saved to `/tmp/ux-agent/screenshots/` for your local analysis.
They must **never** be inserted into the conversation.

## Output format

Produce a single review report after all navigation is complete.

### UX Findings

For each finding:

```
<severity> / <confidence%> / <screen> / <evidence> / <why it matters> / <concrete fix>
```

Severity: High / Medium / Low
Confidence: 0–100%

### Automation Findings (separate section)

For missing testIDs or untestable flows:

```
<screen> / <what is missing> / <impact on automation> / <suggested testID or fix>
```

## Workflow

1. Navigate the main routes using native commands
2. Collect observations silently (no chat output during navigation)
3. Produce the review report as a single output at the end
4. Stop after covering main routes — do not exhaustively explore every edge case

## Anti-patterns (do NOT do these)

- ❌ "I tapped the tab and saw..."
- ❌ "Here is a screenshot of the current state"
- ❌ "The screenshot shows..."
- ❌ Step-by-step action narration
- ❌ Pasting screenshot data into chat
- ❌ "testID missing, let me analyze the screenshot instead"

## Correct pattern

- ✅ Navigate silently → collect observations → output findings table
- ✅ "testID missing for X" → automation finding, not UX finding
- ✅ One compact report at the end
