# Psycle Operations Spec

> Version 1.0 | 2024-12-25
> Scope: Runtime procedures, NOT content quality rules

---

## 1. Operating Modes

### Mode A: Antigravity Manual Generation (Current)

**Status**: ACTIVE

| Aspect | Spec |
|--------|------|
| Engine | Antigravity (human-in-the-loop) |
| Volume | Unlimited (based on user request) |
| Speed | ~2-3 min per lesson |
| Cost | None (conversation-based) |

**Workflow**:
1. User requests lesson (theme/domain or "continue")
2. Antigravity generates 10-question lesson
3. Self-audit via Audit Report
4. Save to `data/lessons/{domain}_units/`

---

### Mode B: API Automated Generation (Future)

**Status**: INACTIVE (waiting for revenue conditions)

| Aspect | Spec |
|--------|------|
| Engine | Gemini API (patrol.ts) |
| Volume | ~0-2 questions/day |
| Speed | Automated, daily 18:00 JST |
| Cost | API quota consumption |

**Activation Conditions**:
1. Psycle achieves revenue self-sustainability
2. Antigravity patterns are documented in prompts/templates
3. Same I/O contract is maintained

---

## 2. I/O Contract (Immutable)

Both modes MUST produce identical output structures.

### Seed Schema
```json
{
  "seed_id": "string",
  "core_principle": "string",
  "counter_intuitive_insight": "string",
  "actionable_tactic": "string",
  "domain": "social | mental | money | health | productivity | work",
  "evidence_grade": "gold | silver | bronze"
}
```

### Question Schema
```json
{
  "id": "string",
  "type": "swipe_judgment | multiple_choice | select_all | sort_order | conversation",
  "question": "string",
  "domain": "string",
  "difficulty": "easy | medium | hard",
  "xp": "number",
  "explanation": "string",
  "actionable_advice": "string | null"
}
```

### Lesson Schema
```json
// {domain}_auto_l{nn}.ja.json
[Question, Question, ...] // Array of 10 questions
```

### Storage Paths
| Domain | Path |
|--------|------|
| social | `data/lessons/social_units/` |
| mental | `data/lessons/mental_units/` |
| money | `data/lessons/money_units/` |
| health | `data/lessons/health_units/` |
| productivity | `data/lessons/study_units/` |
| work | `data/lessons/work_units/` |

---

## 3. Quality Gate (Mandatory)

### Audit Report Format

Every generation MUST include this report at the end:

```
━━━ Audit Report ━━━
1. 断定語なし: Yes/No
2. Phase4正解UI禁止: Yes/No
3. 誇大表現なし: Yes/No
4. Evidenceテンプレ: Yes/No
5. Life-Scene First: Yes/No

→ [All Clear / Violation Found]
```

### Rules
- **Yes** = Rule is satisfied (no violation)
- **No** = Rule is violated
- If ANY item is **No** → Fix immediately, do NOT save
- This format maps 1:1 to `critic.ts` for future API migration

---

## 4. Antigravity Runtime Rules

### Must Do
1. Generate in specified Lesson JSON schema
2. Always include `domain` field (Fail Fast if undefined)
3. Phase 4 (How) uses `recommended_index`, NOT `correct_index`
4. Evidence templates are verbatim (Gold/Silver/Bronze)
5. Attach Audit Report to every output
6. Fix violations before saving

### Must NOT Do
1. Save content that fails audit
2. Ask user for approval on routine decisions
3. Use "絶対", "必ず", "確実に" (dogmatic language)
4. Use "正解", "不正解", "○", "×" in Phase 4

---

## 5. Migration Checklist (Mode A → Mode B)

When transitioning to API automation:

| Check | Criteria |
|-------|----------|
| Revenue | Psycle is self-sustaining |
| Patterns | Antigravity's winning prompts documented |
| Contract | JSON schemas unchanged |
| Audit | `critic.ts` passes same rules |
| Router | Domain Router unchanged |
| Bundler | Lesson Bundler unchanged |

**Migration is just swapping the "engine" while keeping everything else fixed.**
