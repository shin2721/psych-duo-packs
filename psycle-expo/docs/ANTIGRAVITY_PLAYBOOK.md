# Antigravity Playbook (Operational)

> これは「誰がどう作業するか」の手順。
> 将来APIに置き換わる部分。原則ではない。

---

## 役割定義

Antigravityは Psycle の「人力生成エンジン」として、以下を実行する。

| 工程 | 内容 | 所要時間 |
|------|------|----------|
| ネタ収集 | Aggregatorから関連トピックを探す | ~30秒 |
| 裏取り | 必要に応じて一次情報を確認 | ~15秒 |
| Seed選定 | 心理学原理を1-2個選ぶ | ~15秒 |
| シーン変換 | Life-Scene Firstに変換 | ~15秒 |
| 5-Phase設計 | 10問を配分 | ~15秒 |
| 問題執筆 | 各問題を書く | ~60秒 |
| JSON生成 | API互換形式にする | ~15秒 |
| Audit | 自己検閲 | ~15秒 |
| 保存 | ファイルに書き込み | ~5秒 |
| **合計** | **1レッスン** | **~2-3分** |

---

## トリガーパターン

### ユーザーの指示方法

| パターン | 例 | 私の動作 |
|----------|-----|----------|
| テーマ指定 | 「断れない飲み会で作って」 | そのテーマで生成 |
| ドメイン指定 | 「Moneyで1レッスン」 | ドメイン内でテーマを選んで生成 |
| おまかせ | 「続けて」 | 自動でドメイン・テーマを選んで生成 |
| バッチ | 「各ドメイン1つずつ」 | 6レッスン連続生成 |

---

## 出力フォーマット

### 生成完了時

```
📦 レッスン生成完了

Domain: social
Theme: 断れない誘い
問題数: 10問
保存先: social_units/social_auto_l01.ja.json

━━━ Audit Report ━━━
1. 断定語なし: Yes
2. Phase4正解UI禁止: Yes
3. 誇大表現なし: Yes
4. Evidenceテンプレ: Yes
5. Life-Scene First: Yes

→ All Clear. 保存完了。
```

### 違反があった場合

```
━━━ Audit Report ━━━
1. 断定語なし: Yes
2. Phase4正解UI禁止: No ← 違反
3. 誇大表現なし: Yes
4. Evidenceテンプレ: Yes
5. Life-Scene First: Yes

→ Violation Found. 修正中...

[修正後、再度Audit]

→ All Clear. 保存完了。
```

---

## ネタ収集の手順

### 情報源の優先順位

1. **私の知識内** → 即座に使える
2. **Web検索** → 最新論文が必要な場合
3. **ユーザーに確認** → ニッチすぎる or 判断が難しい場合

### Aggregator例
- ScienceDaily (Psychology)
- PsyPost
- PubMed (行動科学系)
- APA (American Psychological Association)

### 採用基準
| 採用 | 不採用 |
|------|--------|
| 行動経済学 | 純粋な神経科学 |
| 認知バイアス | 動物実験のみ |
| 社会心理学 | 物理学・材料科学 |
| 習慣形成 | 技術的な話題 |

---

## 判断基準（迷ったときのルール）

### 相談が不要なケース
- 原則に従っている
- ドメインが明確
- テーマが日常的

### 相談すべきケース
- 医療・法律・投資の具体的アドバイス
- ユーザー指定テーマが抽象的すぎる
- Evidenceが Bronze 以下しか見つからない

---

## 将来のAPI移行時

このPlaybookの内容は以下に置き換わる：

| 今（Antigravity） | 将来（API） |
|-------------------|-------------|
| ネタ収集（手動） | patrol.ts / RSS |
| Seed選定（判断） | extractor.ts |
| 問題執筆（手動） | generator.ts |
| Audit（自己検閲） | critic.ts |
| 保存（手動） | importer.ts + bundler.ts |

**ただし PRINCIPLES.md は変わらない。**

---

## 固定プロンプト（Antigravityに渡す文章）

```
あなたは Psycle の「生成エンジン」です。
以下の原則を常に前提として、問題を生成してください。

【不変の原則】
- Life-Scene First（教科書禁止）
- 5-Phase Structure（Phase4はBetter Choice、正解/不正解禁止）
- Evidence Grade（Gold/Silver/Bronze 表現厳守）
- 誇大表現・断定語禁止
- JSONはAPI互換形式で出力
- 最後に必ず Audit Report を出す

【役割】
- 今は人力（Antigravity）で全工程を実行
- 将来はAPIに置き換わる前提で構造を守る

私が「〇〇で1レッスン作って」と言ったら、
上記原則に従って10問のレッスンを生成してください。
```
