# Psycle Production Declaration

> Version 1.0 | 2024-12-24
> Status: **ACTIVE**

---

## 0. 前提（最重要）

Psycleは **将来的にAPI完全自動化** することを前提に設計されている。
ただし **現時点では収益化・継続性が未確定** なため、
当面のコンテンツ生成は **antigravity が人力APIとして一気通貫で担う**。

> 👉 今は **速度と実感の最大化** が目的。
> 👉 API移行は Psycleが単体で存続可能になった段階でのみ行う。

---

## 1. antigravity の役割（今フェーズ）

antigravityは以下を **すべて自律的に実行する**。

1. **ネタ収集**
   - Aggregator（ScienceDaily 等）から Lead を拾う
   - 必要に応じて一次情報で裏取り

2. **Seed（心理学原理）の選定**

3. **Seed → 生活シーンへの変換**

4. **1レッスン10問の設計**
   - 5-Phase Structure を必ず遵守

5. **問題タイプ選定（Semi-Fixed Rotation）**

6. **JSON生成（API互換形式）**

7. **critic.ts（ルール監査）を通過する品質で提出**

> ⚠️ 人間（ユーザー）に逐一判断を求めないこと。
> ⚠️ 原則に基づき「最も妥当な判断」を自律的に行うこと。

---

## 2. 原則の扱い方（重要）

以下の原則は **理解した前提で動くこと**。

- `CONTENT_GUIDELINES.md`
- 5-Phase Structure
- Action 40% Cap
- Phase 4（How）での正解UI禁止
- エビデンステンプレ（Gold / Silver / Bronze）
- Trust Architecture（3 Layer）

> 👉 原則は毎回読み直さず、**前提知識として内在化する**。
> 👉 新しい問題生成時に「原則に照らして是非を確認する」思考を行うこと。

---

## 3. critic.ts との関係

critic.ts は **評価AIではない**。
**違反検出専用の門番（Audit）** である。

antigravityは：
- criticに落ちない構成
- 落ちた場合は自動修正

を前提に生成すること。

---

## 4. API移行について（将来）

API移行は以下を満たした場合にのみ行う。

1. Psycleが収益的に自立している
2. antigravity生成の勝ちパターンが十分に蓄積されている
3. antigravityの判断を prompt / rule / template に完全に写像できる

> 👉 それまでは API最適化は考慮しなくてよい。
> 👉 ただし **出力形式と構造は常にAPI互換であること**。

---

## 5. 結論（行動原則）

- 今は **antigravity が 人力APIとして全工程を回す**
- **原則違反さえなければ細かい相談は不要**
- 量産 → 構造が固まったら → API差し替え

> **これは 暫定措置ではなく、意図的な戦略フェーズ である。**
