# CLAUDE.md

This file provides workspace-level guidance for Claude Code in this repository.

@AGENTS.md

## 応答言語

すべての応答は日本語で行うこと。コミットメッセージやPRタイトルなど、英語が慣習的に使われる箇所は英語のままでよい。

## 実行ルール

- ユーザーの明示的な許可なくコマンドやスクリプトを実行しないこと。必ず事前に確認を取る。
- 実行が許可された場合、変更が発生したらその場でコミットとプッシュまで一連で行うこと。
- リポジトリでは `.githooks/post-commit` により `main` へのコミット後に自動 `git push origin main` を実行する。

## Always Use Latest Psycle Branch

Always sync from the repository root and operate on `main`.
This workflow does not support `claude/*` worktree branches.

At the start of every session, run:

```bash
./tools/sync_psycle_latest.sh
```

This script is **main-only**. Branch arguments are not allowed.

If sync fails, stop and report the exact error before editing files.

## Required Freshness Check

For every review/fix request, do this before reading or editing code.
Do not proceed unless all checks pass:

1. Run `./tools/sync_psycle_latest.sh`
2. Confirm current branch is exactly `main`:
   - `git branch --show-current`
3. Confirm local and remote hashes match:
   - `git rev-parse --short HEAD`
   - `git rev-parse --short origin/main`
4. Confirm worktree is clean:
   - `git status --short`
5. Confirm there are no unpushed commits on main:
   - `git rev-list --count origin/main..main`
   - Must be `0` before review (if not, run `git push origin main`)

If any check fails, do not continue analysis. Report the failure and resolve sync first.

## Branch / PR Policy

- Work only on `main`.
- Do not create or switch to `claude/*` branches.
- Do not create PRs for routine sync/review replies.

## Cross-Agent Review Presets

When the user asks for Codex/Claude cross-review, generate the prompt with:

```bash
./tools/generate_cross_review_prompt.sh <mode> [<range>]
```

Modes:
- `codex_impl_by_claude`
- `claude_impl_by_codex`
- `codex_plan_by_claude`
- `claude_plan_by_codex`

## Psycle Simulator / UI Verification Rules

- PsycleのUI作業では、可能な限りまずComputer UseでSimulatorを直接見る。
- 保存スクショだけでUI判断をしない。スクショは直接確認後の証跡として使う。
- Simulatorにフォーカスがある場合のリロードは `Cmd+R`。Metroターミナルにフォーカスがある場合のリロードは `r`。
- UI変更が反映されない場合、まず起動中のアプリを確認する。
  - dev-client: `com.s6n2j9.psycle`
  - release: `com.shin27.psycle`
- 通常のUI修正確認ではdev-clientを使う。
- ユーザーが明示しない限り、通常のデザイン・配置確認にreleaseアプリを使わない。
- 同じSimulatorにdev-clientとreleaseが両方入っている場合、URL scheme競合を疑う。
- ユーザーが特定の配置・見た目修正を求めた時は、指摘された範囲だけ触る。
- 依頼されていないモーション、背景演出、色、文言、CTA挙動、ナビゲーションを変更しない。
- 好みでUIを変える前に、現在のSimulator画面を確認し、変更範囲を最小化する。
