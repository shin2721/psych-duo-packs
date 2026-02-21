# CLAUDE.md

This file provides workspace-level guidance for Claude Code in this repository.

## Always Use Latest Psycle Branch

Always sync the repository from the current session's working tree.
Do not force a fixed absolute path, because Claude/Codex sessions often run in worktrees.

At the start of every session, run:

```bash
./tools/sync_psycle_latest.sh
```

This defaults to `main`.

If needed, you may pass a branch name explicitly:

```bash
./tools/sync_psycle_latest.sh main
```

If sync fails, stop and report the exact error before editing files.

## Required Freshness Check

For every review/fix request, do this before reading or editing code:

1. Run `./tools/sync_psycle_latest.sh`
2. Confirm local and remote hashes match:
   - `git rev-parse --short HEAD`
   - `git rev-parse --short origin/main`
3. Confirm worktree is clean:
   - `git status --short`

If any check fails, do not continue analysis. Report the failure and resolve sync first.

## No Auto-Execution Policy

Claude は明示的な指示なしに以下の操作を自動実行してはならない。

### 禁止事項（ユーザーの明示的な許可がない限り実行しない）

1. **スクリプト・コマンドの実行** — `bash`、`npm run`、`python` 等のコマンドをユーザーの指示なく実行しない。ビルド、テスト、デプロイなどもすべて同様。
2. **ファイルの作成・書き込み・削除** — 既存ファイルの編集や新規ファイルの作成は、ユーザーが明確に依頼した場合のみ行う。
3. **Git 操作** — `git commit`、`git push`、`git merge`、`git rebase` 等の変更を伴う Git コマンドはユーザーの指示なく実行しない。`git status` や `git log` 等の読み取り専用コマンドは許可する。
4. **外部サービスへの通信** — API 呼び出し、Webhook 送信、外部サービスへのデータ送信はユーザーの許可なく行わない。
5. **依存関係のインストール・更新** — `npm install`、`pip install` 等のパッケージ操作はユーザーの指示なく実行しない。

### 許可される自動操作

- ファイルの**読み取り**（コード理解・調査目的）
- `git status`、`git log`、`git diff` 等の**読み取り専用 Git コマンド**
- コードベースの**検索**（grep、glob 等）
- ユーザーへの**質問・確認**

### 実行前の確認ルール

破壊的・副作用のある操作を行う前に、必ず以下を実施する：

1. 実行しようとしている操作の内容をユーザーに説明する
2. ユーザーから明示的な承認を得る
3. 承認を得てから実行する

「〜してください」「〜を実行して」等の明示的な指示がない限り、提案のみに留めること。
