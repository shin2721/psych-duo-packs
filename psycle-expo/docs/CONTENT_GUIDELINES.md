# Psycle Content Guidelines (手順書)

> **📋 Product principles / lesson-quality contracts は [docs/PRINCIPLES.md](./PRINCIPLES.md) が正本です**
> **Runtime / package / ops contracts は [docs/CONTENT_SYSTEM_SPEC.md](./CONTENT_SYSTEM_SPEC.md) が正本です**
> **このファイルは実装ガイドラインのみを記載します**

---

## 実装ガイドライン

### Trust Architecture (3-Layer Mode)
- Layer 1: レッスン体験（引用なし）
- Layer 2: 完了画面（免責先行）
- Layer 3: 詳細ライブラリ（Pro向け）

### Duolingo Standard
- **レッスン構成**: [docs/PRINCIPLES.md](./PRINCIPLES.md) 参照
- **One Day Rule**: 明日1回使える粒度
- **Phase 4**: 詳細は [docs/PRINCIPLES.md](./PRINCIPLES.md) 参照

### Evidence Templates
固定テンプレートを使用（詳細は正本参照）

**品質判断は [docs/PRINCIPLES.md](./PRINCIPLES.md)、運用契約は [docs/CONTENT_SYSTEM_SPEC.md](./CONTENT_SYSTEM_SPEC.md) を参照してください。**

---

## Engine-Agnostic Principle

人力（Antigravity）でもAPIでも、同じJSON契約とCritic監査を通過したもののみ配布。
