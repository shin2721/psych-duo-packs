# Psycle Lesson Authoring（入口・手順書）

> **📋 Product principles / lesson-quality contracts は [docs/PRINCIPLES.md](./PRINCIPLES.md) が正本です**
> **Seed / claim / package / ops contracts は [docs/CONTENT_SYSTEM_SPEC.md](./CONTENT_SYSTEM_SPEC.md) が正本です**
> **このファイルは入口として、リンクと最小限の手順のみを記載します**

---

## 📖 仕様参照

**品質判断は [docs/PRINCIPLES.md](./PRINCIPLES.md)、運用契約は [docs/CONTENT_SYSTEM_SPEC.md](./CONTENT_SYSTEM_SPEC.md) を参照してください。**

---

## 🔄 運用モード

### Mode A 手順（人間が作る）

**やること:**
1. [docs/PRINCIPLES.md](./PRINCIPLES.md) の仕様に従ってレッスン作成
2. `data/lessons/{domain}_units/` に直接配置
3. インデックス更新とバリデーション

**実行コマンド:**
```bash
npm run gen:units
```

### Mode B 手順（自動生成）

**やること:**
1. 自動生成（staging配置）
2. バリデーション
3. 承認（Evidence Card の human_approved を true に変更）
4. 昇格

**実行コマンド:**
```bash
# 1. 自動生成（staging配置）
cd scripts/content-generator
npm run patrol

# 2. バリデーション
npm run validate:lessons

# 3. 昇格
npm run promote:lesson {domain} {basename}
```

---

## ⚠️ 重要な制約

- **仕様変更禁止**: このファイルで独自ルールを追加しない
- **正本参照**: 品質判断は [docs/PRINCIPLES.md](./PRINCIPLES.md)、運用契約は [docs/CONTENT_SYSTEM_SPEC.md](./CONTENT_SYSTEM_SPEC.md) を確認
- **staging必須**: Mode B生成物の本番直入れは禁止
