# Psycle Operations Spec

> Version 1.0 | 2024-12-25
> Scope: Runtime procedures, NOT content quality rules

---

## 0. Billing Runtime (P0.4)

### Source of truth

- Billing backend is **Supabase Edge Functions only**.
- Active endpoints:
  - `create-checkout-session`
  - `stripe-webhook`
  - `portal`
  - `restore-purchases`
- `psycle-billing` is frozen as reference-only and must not be used in production routing.

### Required secrets

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_PRO_MONTHLY_V2` (JP新規14日価格A/Bを有効化する場合)
- `STRIPE_PRICE_PRO_YEARLY` (Pro年額を有効化する場合)
- `STRIPE_PRICE_MAX` (reserved for future Max relaunch)
- `FRONTEND_SUCCESS_URL`
- `FRONTEND_CANCEL_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Expo runtime: `EXPO_PUBLIC_SUPABASE_FUNCTION_URL`

### Webhook registration

- Stripe Dashboard -> Developers -> Webhooks
- Endpoint URL: `{EXPO_PUBLIC_SUPABASE_FUNCTION_URL}/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `customer.subscription.deleted`

### Failure checklist

1. `price mismatch`
- Confirm Stripe Price IDs match `STRIPE_PRICE_PRO/MAX` in Supabase secrets.
2. `webhook signature failure`
- Verify `STRIPE_WEBHOOK_SECRET` exactly matches the configured endpoint secret.
3. `checkout starts but plan not reflected`
- Confirm webhook target points to Supabase `stripe-webhook`, not legacy Next.js route.
4. `portal/restore fails`
- Confirm function URL is set in Expo env as `EXPO_PUBLIC_SUPABASE_FUNCTION_URL`.

---

## 0.5 Notifications Runtime (v1.20)

### Source of truth

- Reminder logic is local-only (`expo-notifications`), no server push in v1.20.
- Notification risk basis is **Study streak only** (`studyStreak` / `lastStudyDate` in `/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/streaks.ts`).
- `inactive` users (no `lastStudyDate`) are excluded from streak risk reminders.

### Reminder types and schedule (local time)

- `streak_risk`: daily 22:00
- `daily_quest_deadline`: daily 21:00
- `league_demotion_risk`: Sunday 18:00 (only when `my_rank >= demotion_zone`)

### Runtime behavior

1. App boot (after auth + state hydration) calls reminder sync.
2. Reminder sync first clears existing Psycle reminders, then re-schedules eligible reminders only.
3. Settings notification toggle is persisted and gates scheduling.
4. Tapping reminders routes to:
- `/(tabs)/course`
- `/(tabs)/quests`
- `/(tabs)/leaderboard`

### Failure checklist

1. Reminders not shown:
- Confirm app has system notification permission.
- Confirm in-app toggle is ON.
2. Streak reminder unexpected:
- Check `lastStudyDate` and local timezone date boundary.
3. League reminder missing:
- Confirm it is Sunday local time and user is in demotion zone.

---

## 0.6 Energy + Paywall Runtime (v1.21)

### Source of truth

- Energy is the only lesson gating resource. `focus` runtime has been removed.
- Free baseline remains:
  - `daily_cap = 3`
  - `energy_refill_minutes = 60`
- First-day onboarding bonus:
  - `first_day_bonus_energy = +3`
  - valid for 24 hours from first local launch timestamp.

### Runtime behavior

1. On first authenticated hydration, app stores `first_launch_at_{userId}`.
2. During first 24h, effective free cap is `3 + 3 = 6`.
3. After 24h, cap automatically returns to 3.
4. If current energy is above cap at expiry, it is clamped to the effective cap.

### Paywall rule

- Paywall is now **study-only**:
  - show only when `lesson_complete_count >= 3`.
- self-report actions do not participate in paywall eligibility.

### Monitoring checklist

1. `first_day_energy_bonus_granted` events are present for new users.
2. `energy_blocked` should not spike in first-day cohorts.
3. `checkout_start` and `plan_changed / checkout_start` should not regress.

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

**Safety Requirements**:
- All Mode B content goes to `_staging` first
- Human approval required before production promotion
- Use `scripts/promote-staged-lesson.sh` for promotion

---

## 2. Quality Maintenance (Automated)

### Daily Quality Checks

**Local Development**:
```bash
# Three-point verification (must all PASS)
npm run content:preflight
npm run lint:lesson-authoring  
npm run validate:lessons
```

**CI/CD Enforcement**:
- PR/push triggers automatic quality checks
- Core validations (validate:lessons, lint:lesson-authoring) FAIL CI
- Quality checks (preflight components) generate WARNINGs
- Reports uploaded as CI artifacts (30-day retention)

### Quality Reports Management

**Generated Reports** (machine-generated, not git-tracked):
- `lesson_inventory.md` - レッスン棚卸し
- `bronze_assertion_warnings.md` - Bronze断定表現警告  
- `evidence_grade_inflation.md` - Evidence Grade インフレ警告
- `citation_trackability.md` - 引用追跡可能性
- `evidence_specificity.md` - Evidence薄さ警告
- `claim_alignment.md` - Claim整合性警告

**Access Methods**:
- Local: `npm run content:preflight` generates latest reports
- CI: Download from GitHub Actions artifacts
- Manual commit only if permanent documentation needed

### Failure Response

**If Quality Checks Fail**:
1. Identify failing component via individual scripts
2. Fix content issues (not quality system)
3. Re-run verification before merge
4. Never bypass quality gates

---

## 3. I/O Contract (Immutable)

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

---

## 8. A/A Gate Runbook（Experiment/Personalization）

### 目的
- `experiments` / `personalization` の有効化前に、計測配線と分岐安定性を確認する。

### 既定値
- `config/gamification.json`
  - `experiments.enabled=false`（配信直前にON）
  - `experiments.experiments.double_xp_nudge_lesson_complete.enabled=true`
  - `experiments.experiments.double_xp_nudge_lesson_complete.rollout_percentage=5`
  - `personalization.enabled=false`
  - `liveops.enabled=false`

### 手順
1. A/A時は対象実験の `control/variant` の `payload` を同一に設定する（差分なし）。
2. `rollout_percentage` を `5% -> 20% -> 50% -> 100%` で段階展開し、各段階を `24-48h` 観測する。
3. `experiment_exposed` と `experiment_converted` が欠落なく収集されていることを各段階で確認する。
   - 併せて monetization ガードレールとして `plan_changed / checkout_start` を日次確認する。
4. A/A検証では主要KPI差分が `±2%` 以内であることを合格条件にする。
5. 合格後にのみ variant payload を本実験内容に差し替える（`personalization` は別ゲートで判定）。

### ロールバック
1. 異常検知時は同日中に `experiments.enabled=false`, `personalization.enabled=false` へ戻す。
2. 影響期間のイベント欠落/異常値をダッシュボード注記に残す。

### A/A運用実績（記録欄）
| Date (JST) | rollout_percentage | Duration | exposed_count | converted_count | KPI Δ (lesson_complete_user_rate_7d) | KPI Δ (paid_plan_changes_per_checkout_7d) | Judge | Owner | Notes |
|---|---:|---|---:|---:|---:|---:|---|---|---|
| 2026-03-01 | 5% | 48h (planned) | | | | | pending | | start after release traffic |
| 2026-03-03 | 20% | 24-48h | | | | | pending | | promote only after 5% pass |
| 2026-03-05 | 50% | 24-48h | | | | | pending | | promote only after 20% pass |
| 2026-03-07 | 100% | 24-48h | | | | | pending | | promote only after 50% pass |

### A/A合格判定（固定）
- exposed: `experiment_exposed > 0`（当日欠損なし）
- converted: `experiment_converted >= 0`（欠損なし）
- `lesson_complete_user_rate_7d` の variant 差分が `±2%` 以内
- `paid_plan_changes_per_checkout_7d` の variant 差分が `±2%` 以内
- 上記を満たさない場合は同日中に `experiments.enabled=false` へロールバックし、時刻・影響範囲・復旧時刻を Notes に記録

### 先行リリース検証チェックリスト（v1.39.x）
- [ ] E2E: Course paywall -> Shop 遷移（`paywall_upgrade_clicked`）
- [ ] E2E: MistakesHub start -> complete（`mistakes_hub_session_started/completed`）
- [ ] E2E: League reward claim（`league_reward_claimed`）
- [ ] E2E: Friend challenge claim 冪等（二重受取不可）
- [ ] RLS: `friend_challenge_claims` は本人のみ SELECT/INSERT 可
- [ ] RLS: `pending_rewards` は本人の claim のみ可
- [ ] RLS: `league_members` UPDATE は本人行のみ可

### 実施ログ（2026-03-01 JST）
- [x] Regression smoke: `npx jest --watchman=false`（38 suites / 177 tests PASS）
- [x] Regression smoke: `npm run validate:lessons`（PASS）
- [x] Regression smoke: `npm run content:i18n:check`（PASS）
- [x] Regression smoke: `npm run content:i18n:smoke`（PASS）
- [x] RLS static policy確認（migration確認）
  - `supabase/migrations/20260228_friend_challenge_claims.sql`
  - `supabase/migrations/pending_rewards.sql`
  - `supabase/migrations/weekly_leagues.sql`
- [ ] RLS runtime確認（実DBで本人/他人アカウント検証）
- [ ] 実機E2E確認（paywall/shop, mistakes hub, league reward, friend claim）

### 実施ログ（2026-03-01 JST / v1.40.3）
- [x] Regression smoke: `npx jest --watchman=false`（39 suites / 184 tests PASS）
- [x] Regression smoke: `npm run validate:lessons`（PASS）
- [x] Regression smoke: `npm run content:i18n:check`（PASS）
- [x] Regression smoke: `npm run content:i18n:smoke`（PASS）
- [ ] A/A 5% 判定（2026-03-03 JST）
- [ ] RLS runtime確認（実DBで本人/他人アカウント検証）
- [ ] 実機E2E確認（paywall/shop, mistakes hub, league reward, friend claim）

## 9. v1.40 P2 Rollout（Pro年額 + Proトライアル）

### 適用条件
- P1 A/Aの100%段階まで完了し、A/A合格判定を満たしていること
- `checkout.max_plan_enabled=false` を維持したまま開始すること
- `personalization.enabled=false`, `liveops.enabled=false` を維持すること

### Pro年額（先行）
0. Shop上のPro年額UIは `entitlements.json` の `plans.pro.stripe_price_id_yearly` が非空の場合のみ表示される。
1. `entitlements.json` の `plans.pro.stripe_price_id_yearly` に有効な Stripe Price ID を設定
2. `create-checkout-session` の `STRIPE_PRICE_PRO_YEARLY` シークレットを設定
3. Shop で Pro 年額トグルを有効化した状態で checkout URL の生成を確認

### ProトライアルA/B（先行）
1. 実験ID `pro_trial_checkout` を利用（control: `trialDays=0`, variant: `trialDays=7`）
2. 初期ロールアウト `5%` で開始し、`5 -> 20 -> 50` の順に段階展開
3. 判定KPI:
   - `checkout_start -> plan_changed` 完了率
   - D7残存
   - 返金率（Stripe）
4. 悪化時は当該実験のみ `enabled=false` で停止

### v1.40.3 実行ステータス（2026-03-01 JST）
- P1: `double_xp_nudge_lesson_complete` は `rollout=5%` 設定済み。`experiments.enabled=false` で待機中。
- P2-Pro年額: コード準備済み。`STRIPE_PRICE_PRO_YEARLY` と `entitlements.plans.pro.stripe_price_id_yearly` の設定待ち。
- P2-Proトライアル: 実験定義済み（`pro_trial_checkout.enabled=false`）。P1合格後に5%開始。
- Max開放: `checkout.max_plan_enabled=false` 維持。

## 10. v1.41 Monetization Rollout（2層 + 新規限定価格A/B）

### 固定方針
- プランは `Free / Pro` の2層運用とし、ShopではMaxを表示しない。
- `checkout.max_plan_enabled=false` は維持する（Max再開はAI解説実装後）。
- Pro年額は `¥7,800`（JP）を初期値とする。
- 価格保護ルール: 既存課金ユーザーは据え置き（価格実験は新規コホートのみ）。
- 実験は同時併走しない（A/A完了後にtrial、trial安定後に価格A/B）。

### 現在値スナップショット（2026-03-01 JST）
- `config/gamification.json`
  - `experiments.enabled=false`
  - `double_xp_nudge_lesson_complete.enabled=true`, `rollout_percentage=5`
  - `pro_trial_checkout.enabled=false`
  - `pro_monthly_price_jp.enabled=false`
  - `checkout.max_plan_enabled=false`
  - `personalization.enabled=false`, `liveops.enabled=false`
- `config/entitlements.json`
  - `plans.pro.stripe_price_id_yearly=""`
  - `plans.pro.stripe_price_id_monthly_v2=""`

### 実行順（固定）
1. **Phase 0（T0前）**: `experiments.enabled=false` を維持し、Release-Day smoke のみ実施。
2. **Phase 1（A/A）**: `experiments.enabled=true` に戻し、`double_xp_nudge_lesson_complete` を `5 -> 20 -> 50 -> 100` で展開（各24-48h）。
3. **Phase 2（固定運用）**: Pro年額のみ有効化（`¥980/月`, `¥7,800/年`）し、14日観測。
4. **Phase 3（A/B）**: `pro_trial_checkout` を `5 -> 20 -> 50` で段階展開。
5. **Phase 4（A/B）**: `pro_monthly_price_jp` を `5 -> 20 -> 50` で段階展開（JP新規14日free限定）。

### フェーズ遷移ゲート
- Phase 1 合格条件（各段階）:
  - `experiment_exposed > 0`
  - `experiment_converted >= 0`
  - `lesson_complete_user_rate_7d` 差分 `±2%` 以内
  - `paid_plan_changes_per_checkout_7d` 差分 `±2%` 以内
- Phase 2 合格条件:
  - `checkout_start(billingPeriod=yearly)` 欠損なし
  - `plan_changed` 欠損なし
  - 返金率悪化なし
- Phase 3/4 合格条件:
  - `plan_changed / checkout_start` 改善または横ばい
  - D7残存悪化なし
  - 返金率悪化なし

### Phase 4 対象条件（価格A/B）
- `profiles.plan_id = free`
- `account_age_days <= 14`
- 地域JP
- サーバー検証: `priceVersion=variant_a` は `priceCohort=jp_new_14d_free` かつ上記条件一致時のみ許可し、それ以外は `price_cohort_mismatch` で拒否。

### 運用ルール（フェアネス）
- 実験対象外ユーザーには control 価格のみ提示する。
- 既存課金ユーザーに `variant_a` 価格を適用しない。

### 記録必須項目
- `checkout_start`（`billingPeriod`, `trialDays`, `priceVersion`, `priceCohort`）
- `plan_changed`（`priceVersion`）
- `plan_changed / checkout_start` 完了率（priceVersion別）
- D7残存、返金率

### Release-Day Monetization Smoke（当日固定手順）
1. **Pre-flight Secrets一致確認**
   - `STRIPE_PRICE_PRO`
   - `STRIPE_PRICE_PRO_YEARLY`
   - `STRIPE_PRICE_PRO_MONTHLY_V2`（価格A/B時のみ）
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. **UI/導線確認**
   - 年額ID未設定: Pro年額トグル非表示
   - 年額ID設定: Pro年額トグル表示
   - Maxは非表示継続
3. **Checkout成功確認**
   - `checkout_start` 発火（`billingPeriod`, `trialDays`, `priceVersion`, `priceCohort`）
   - checkout URL生成成功、Stripe遷移成功
4. **Webhook反映確認**
   - `profiles.plan_id='pro'`
   - `profiles.active_until` 更新
   - `plan_changed` 発火
5. **フェアネス検証**
   - 非対象ユーザーで `variant_a` 要求 -> `price_cohort_mismatch`（400）
   - 対象ユーザーのみ `variant_a` checkout許可
6. **停止手順**
   - trialのみ停止: `pro_trial_checkout.enabled=false`
   - 価格A/Bのみ停止: `pro_monthly_price_jp.enabled=false`
   - 全実験停止: `experiments.enabled=false`

### `price_cohort_mismatch` アラート規則（固定）
- **Warning**
  - 1時間で `>= 3` 件、または
  - `checkout_start` 대비 `>= 0.5%`
- **Critical**
  - 1時間で `>= 10` 件、または
  - `checkout_start` 대비 `>= 2.0%`

### `price_cohort_mismatch` 異常時オペレーション
1. まず対象実験のみ停止（trial または 価格A/B）。
2. 15分以内に再計測する。
3. 継続異常なら `experiments.enabled=false` で全停止する。
4. 同日中に `OPERATIONS.md` 実績行へ時刻・影響・復旧方法を記録する。
