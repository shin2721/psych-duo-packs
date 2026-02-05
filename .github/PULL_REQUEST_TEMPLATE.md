<!-- Default template. If this PR is not i18n-related, replace sections with a brief summary and testing notes. -->
## Summary
- [ ] 追加/更新した翻訳ファイルを列挙した
- [ ] 影響ユニット（mental/health/money/social/study/work）を明記した

## Changed files
- [ ] `psycle-expo/data/lessons/**/**/*.en.json`（必要分）
- [ ] `psycle-expo/data/lessons/**/index.ts`（genで更新）
- [ ] その他（あれば）

## Validation (paste outputs)
- [ ] `cd psycle-expo && node scripts/gen-lesson-locale-index.js`
- [ ] `cd psycle-expo && node scripts/validate-lesson-locales.js --check`
- [ ] `cd psycle-expo && npm run content:i18n:check`

## Quality checklist
- [ ] プレースホルダ不整合なし（例: `{{count}}`）
- [ ] 選択肢数・構造の差異なし
- [ ] フォールバック仕様（requested -> en -> ja）を壊していない
