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

> **⚠️ Important**: After adding new lesson files (e.g., `mental_l05.ja.json`), run `npm run gen:units` to regenerate the index.ts files, then reload Metro bundler.

### Units Index Generation

When adding new lesson files to any domain:

1. **Add the lesson file**: Place `{domain}_l{nn}.ja.json` in the appropriate `data/lessons/{domain}_units/` directory
2. **Regenerate index files**: Run `npm run gen:units` to automatically update all `index.ts` files
3. **Reload Metro**: Restart the Metro bundler to pick up the new imports

The `gen:units` script automatically:
- Scans all `*_units` directories for `*.ja.json` files
- Generates proper import statements with JS-safe identifiers
- Maintains consistent l01, l02, l03... ordering
- Creates both `{domain}Data` and `{domain}Data_ja` exports

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

---

## 6. Mode B運用手順（事故防止）

> **📋 仕様の正本は [docs/PRINCIPLES.md](./PRINCIPLES.md) です**  
> 運用手順のみここに記載し、品質基準・仕様は正本を参照してください。

### 基本フロー
```
自動生成 → staging → 監査 → 人間承認 → 昇格 → 本番
```

### 実行コマンド

**1. 自動生成（staging配置）**
```bash
cd scripts/content-generator
npm run patrol
```
- 出力先: `data/lessons/_staging/{domain}_units/`
- 本番直入れは物理的に不可能

**2. 監査・バリデーション**
```bash
npm run validate:lessons
```
- staging: warning可
- 本番: error不可

**3. 利用可能レッスン確認**
```bash
npm run promote:lesson
```
- 承認状態を一覧表示
- 引数なしで実行

**4. 人間承認**
```bash
# Evidence Card の human_approved を true に変更
vi data/lessons/_staging/{domain}_units/{basename}.evidence.json
```

**5. 本番昇格**
```bash
npm run promote:lesson {domain} {basename}
```
- 自動実行: validate → move → gen:units → validate

### 安全装置

- **staging強制**: Mode B は staging にのみ出力
- **承認ゲート**: human_approved=true 必須
- **自動バリデーション**: 昇格時に2回チェック
- **原子性**: 昇格は全工程成功時のみ完了

---

## 7. レッスン生成仕様（正本参照）

> **📋 仕様の正本は [docs/PRINCIPLES.md](./PRINCIPLES.md) です**  
> 運用手順のみここに記載し、品質基準・仕様は正本を参照してください。

### Mode A運用（人間介在）
```
人間作成 → バリデーション → 本番配置 → gen:units
```

**手順**:
1. [docs/PRINCIPLES.md](./PRINCIPLES.md) の仕様に従ってレッスン作成
2. `data/lessons/{domain}_units/` に直接配置
3. `npm run gen:units` でインデックス更新（バリデーション自動実行）

### Mode B運用（自動生成）
```
自動生成 → staging → 監査 → 承認 → 昇格 → gen:units
```

**手順**:
1. **生成**: `cd scripts/content-generator && npm run patrol`
2. **監査**: `npm run validate:lessons`
3. **承認**: Evidence Card の `review.human_approved` を `true` に変更
4. **昇格**: `npm run promote:lesson {domain} {basename}`

**注意**: 全ての仕様・ルールは [docs/PRINCIPLES.md](./PRINCIPLES.md) を参照してください。
│   └── study_units/
└── {domain}_units/        # 本番（承認済み）
    ├── mental_l01.ja.json
    ├── mental_l01.evidence.json
    └── index.ts
```
