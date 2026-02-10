# Psycle ビッグ化ロードマップ 🚀

> **確率評価**: 現状 12〜22% → S優先度修正後 18〜32% → 成長ループ追加後 25〜40%

---

## 現状の強み（既に勝ち筋）

- ✅ **リーグが "生きた" 実装**（週跨ぎ・冪等・報酬claim・先週締め）
- ✅ **Streak分離**（Study/Action）→ 「行動が主役」という差別化
- ✅ **Config/Entitlements/FeatureGate** → 調整と実験が速い
- ✅ **Dogfoodログ + buildId/schemaVersion** → データ汚染を避けながら学習可能

---

## S優先度：確率を上げる修正

### S1. リソースの一本化（複雑さを減らす）

**現状の問題**: Energy + Focus + Lives + Freeze + DoubleXP が同居しており、UX・バグ・コストが増加。

**解決策**:
- 制限は **1本（Energy）** にする（Duolingoのハート枠相当）
- Focus は内部スコアとして残すならUIに出さない（or Energyに統合）
- Lives は削除 or Energyの別名に統合

**期待効果**: 初見の理解コスト↓ → 継続率↑、実装の地雷↓ → データ汚染↓

---

### S2. 北極星の統一（executed中心）

**現状の問題**: 北極星は `executed`（行動実行）だが、UI/報酬/導線がまだ「学習（study）」寄りの部分がある。

**解決策**:
- 毎日の勝ち条件を **「executedを1回」** に寄せる
- リーグの主スコアも、最終的には executed由来のXP が勝つように調整
- study は "準備" として価値づける（リーグ勝利の手段）

**期待効果**: Psycleの独自性強化（Duolingoとの差別化）、口コミ発生しやすい

---

### S3. 課金モデルの一本化

**現状の問題**: ジャンルPacks（単品課金）と Pro/Max（サブスク）が併走 → 「買う理由」が弱くなる。

**解決策**: 課金は **サブスク中心** に寄せる（Duolingo型）
- Free: 制限あり
- Pro: 制限解除（Energy上限/回復/広告/快適系）
- Max: MistakesHub/高度機能/AI補助など
- Packs は「後で」or「買い切り教材」など別軸にする

---

### S4. 計測を「プロダクト分析」に昇格

**最小で入れるべきイベント**:
- `lesson_start` / `lesson_complete`
- `question_incorrect` / `streak_lost`
- `intervention_shown` / `attempted` / `executed`
- `paywall_shown` / `paywall_clicked` / `purchase_completed`
- `league_viewed` / `league_result_shown` / `league_reward_claimed`
- `d1_return` / `d7_return`（日次集計でもOK）

---

## A優先度：成長ループ（ビッグ化の最後の壁）

- **共有**: リーグ昇格・連続executedのスクショ共有テンプレ
- **紹介**: 招待でGems / Freeze（不正対策は後でOK）
- **復帰**: 連続欠勤の翌日に「救済導線」（Freeze/軽い1タップ実行）

---

## 追加しなくていいもの（今は確率が上がりにくい）

- ❌ 新しいミニゲーム大量追加
- ❌ 機能が多いPro特典の盛り込み（まずは継続と課金を固める）
- ❌ 高度なAI説明（今はコストと複雑さが勝ちやすい）

---

## データ収集フェーズ：最初の1週間で見るべき指標

| 指標 | 確認ポイント |
|------|-------------|
| D1/D7 | リーグ導入で上がってるか |
| executed率 | 1日1回の行動が回ってるか |
| weekly_xpの0率 | 計測/導線が死んでないか |
| paywall表示→購入CVR | 出しすぎてD7を壊してないか |
