# リーグシステム運用マニュアル 🏆

## 1. デプロイ手順

### DB Migration
以下の順序でSQLを実行してください（依存関係順）。

1. **`supabase/migrations/pending_rewards.sql`**
   - `pending_rewards` テーブル作成
   - `claim_league_reward` 関数作成
   - **重要**: `uniqeu (user_id, week_id)` 制約が含まれていること

2. **`supabase/migrations/week_id_rpc.sql`**
   - JST基準の `get_current_week_id`, `get_last_week_id` 作成
   - `add_weekly_xp` 関数更新

3. **`supabase/migrations/weekly_leagues.sql`**
   - `leagues`, `league_members` テーブル作成
   - 初期設定用

### Edge Function
```bash
supabase functions deploy settle-league-week
```
- 必要な環境変数: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LEAGUE_SETTLE_CRON_SECRET`
- `settle-league-week` は **POST + `x-cron-secret` 一致** でのみ実行されます。
- `LEAGUE_SETTLE_CRON_SECRET` 未設定時は 500、secret不一致時は 403 を返します。

---

## 2. リリース前最終チェック（地雷回避） 💣

スモークテストに加え、以下の「壊れると致命的なポイント」を必ず確認してください（所要時間15分）。

1. **週次XP加算の確実性**
   - レッスン完了等でXPが増えた際、**必ず** `league_members.weekly_xp` も増えているか？
   - 1回でも増えないケースがあればNG（リーグ機能不全）。

2. **settleの完全な冪等性**
   - Edge Function (`settle-league-week`) を3回連続で実行。
   - `pending_rewards` のレコード数が増えないこと。
   - `claim` 処理も2回目以降は何も起きない（Gemsが増えない）こと。

3. **Week IDのJST境界**
   - 日曜 23:50 JST と 月曜 00:10 JST で `get_current_week_id()` の値が切り替わることを（SQL実行等で）確認。

4. **Paywall表示ロジック**
   - `lesson` < 3回：表示されないこと。
   - `lesson` >= 3回：**刺さったタイミングで** 表示されること。

---

## 3. 本番設定（Cron）

**推奨スケジュール (JST最適化)**:
```
5 15 * * 0
```
- UTC: 日曜 15:05
- JST: **月曜 00:05**
- 理由: `get_last_week_id` (JST基準) が切り替わった直後の月曜深夜に実行し、朝起きたユーザーに確実に結果を表示するため。

### Cron呼び出し例
```bash
curl -X POST \
  -H "x-cron-secret: $LEAGUE_SETTLE_CRON_SECRET" \
  "https://<project-ref>.functions.supabase.co/settle-league-week"
```
- secret値はログに出さないこと。
- 失敗時はレスポンスコード 403/405/500 を監視対象にしてください。

---

## 4. データ収集フェーズ（KPI観測） 📊

リリース後1週間は、以下の指標を中心に監視してください。

1. **リーグ参加率**
   - 週内にリーグ画面（Leaderboard）を1回でも開いたユーザーの割合。

2. **weekly_xp の分布**
   - 0のユーザーが多すぎないか？（XP加算漏れの検知 / 導線の弱さ）
   - `SELECT weekly_xp, count(*) FROM league_members GROUP BY weekly_xp ORDER BY weekly_xp;`

3. **昇格/降格の比率**
   - 常に全体の約20%になっているか？
   - `SELECT promoted, demoted, count(*) FROM league_members WHERE league_id IN (SELECT id FROM leagues WHERE week_id = get_last_week_id()) GROUP BY promoted, demoted;`

4. **Paywall & Retention**
   - PaywallのCVR（表示回数に対する購入率）。表示過多でD1/D7リテンションが落ちていないかチェック。
   - リーグ導入前後でのD1/D7の変化。

---

## 5. Next Actions（改善バックログ）

データ収集後、数値調整と導線改善を行います（機能追加より優先）。

- **数値調整**: リーグ画面で「昇格まであと◯XP」を強調表示。
- **導線**: Start導線（毎日押すボタン）をコース上部に固定し、回転数を上げる。
- **プラン**: 週プランの検討は、まずリーグとStartの回転が安定してから。
