# Winning Intervention Template (from study_l01)

高Attempt・高Executeの勝ちパターンを抽出。横展開用。

## 1. 構造

```json
{
    "claim_type": "intervention",
    "evidence_type": "indirect|direct",
    "try_this": "👉 [トリガー条件] → [10秒物理アクション]",
    "tiny_metric": {
        "before_prompt": "[実行前の状態確認] (0-10)",
        "after_prompt": "[10秒後の状態確認]",
        "success_rule": "少しでも変化があればOK",
        "stop_rule": "変わらなければ今日は撤退"
    },
    "comparator": {
        "baseline": "[何もしない場合の行動]",
        "cost": "10秒 / 負荷は低い"
    },
    "fallback": {
        "when": "[10秒版が無理な場合]",
        "next": "[1秒版 or 別アプローチ]"
    }
}
```

## 2. 事例 (study_l01)

| ID | try_this | fallback |
|---|---|---|
| 003 | 「10秒だけ教材を開く」 | If-Then計画に切替 |
| 006 | 「○○したら、10秒だけ開く」(If-Then) | スマホ触りたくなったら をトリガーに |
| 008 | 「教材を開いた状態で置く」(環境) | スマホホーム画面にアプリ |

## 3. 横展開ルール

1. **try_this**: 必ず 👉 + トリガー条件 + 物理アクション
2. **fallback**: 必ず「無理なら○秒版」を含む (段階化)
3. **tiny_metric**: before/after で変化を0-10で確認
4. **cost**: 10秒 or 30秒を明記
