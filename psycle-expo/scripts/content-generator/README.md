# Content Generator (Mode B)

> **📋 仕様の唯一の正本は [docs/PRINCIPLES.md](../../docs/PRINCIPLES.md) です**  
> このツールは実行コマンドのみ記載します。ルール本文は正本を参照してください。

---

## 実行コマンド

```bash
cd scripts/content-generator
npm run patrol
```

## 出力先

- **staging固定**: `data/lessons/_staging/{domain}_units/`
- **本番直入れ禁止**: 必ず人間承認後に昇格

## 承認フロー

```bash
# 1. バリデーション
npm run validate:lessons

# 2. Evidence Card で human_approved=true に変更

# 3. 昇格
npm run promote:lesson {domain} {basename}
```

---

## 注意事項

- 仕様変更は正本で行う
- このツールは実行のみ担当
- 品質基準は正本を参照