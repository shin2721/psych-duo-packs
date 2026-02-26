# RUNBOOK_CROSS_AGENT_REVIEW

Codex と Claude の相互レビューを、毎回同じ品質で回すための手順です。

## 目的

- `Codex実装 -> Claude確率レビュー`
- `Claude実装 -> Codex確率レビュー`
- `Codex案 -> Claude確率レビュー`
- `Claude案 -> Codex確率レビュー`

を定型化する。

## 前提

- リポジトリは `/Users/mashitashinji/dev/psych-duo-packs`
- `main` を正とする
- 実装レビュー時はコミット範囲（例: `HEAD~1..HEAD`）を指定する

## 使い方

### 1) Codex実装をClaudeがレビュー

```bash
cd /Users/mashitashinji/dev/psych-duo-packs
./tools/generate_cross_review_prompt.sh codex_impl_by_claude HEAD~1..HEAD
```

### 2) Claude実装をCodexがレビュー

```bash
cd /Users/mashitashinji/dev/psych-duo-packs
./tools/generate_cross_review_prompt.sh claude_impl_by_codex HEAD~1..HEAD
```

### 3) Codex案をClaudeがレビュー

```bash
cd /Users/mashitashinji/dev/psych-duo-packs
./tools/generate_cross_review_prompt.sh codex_plan_by_claude
```

### 4) Claude案をCodexがレビュー

```bash
cd /Users/mashitashinji/dev/psych-duo-packs
./tools/generate_cross_review_prompt.sh claude_plan_by_codex
```

## オプション

- 同期を飛ばしたい場合のみ `--skip-sync` を付ける。

例:

```bash
./tools/generate_cross_review_prompt.sh codex_impl_by_claude 0526e84..HEAD --skip-sync
```

## 期待動作

- スクリプトはデフォルトで `./tools/sync_psycle_latest.sh` を実行して `main` 最新化を確認。
- `main` 以外なら停止。
- 実装レビューモードでは対象差分ファイルを自動で埋め込んだレビュー依頼文を出力。
- そのままコピペで各エージェントに渡せる。

## 注意

- Codex/Claude を「会話のたびに完全自動同期」する公式機構はない。
- このRunbookは「1コマンドで手動同期＋定型レビュー依頼文生成」までを自動化する。
