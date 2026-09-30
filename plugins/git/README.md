# @mgood-pi/plugin-git

> **状态：** 此仓库已实现 v7 发布候选；真实 Pi TUI/disposable-repository 验收和独立 Review 尚未完成，发布前不得将其视为已接受。

Pi extension with three uniform current-Agent Git workflows:

```text
/mgood:git-commit [natural-language constraints]
/mgood:git-commit-push-pr [natural-language constraints]
/mgood:git-commit-push
```

## Install and uninstall

After publication, install globally:

```bash
pi install npm:@mgood-pi/plugin-git
```

Use `pi install -l npm:@mgood-pi/plugin-git` for a project-local install. Uninstall through Pi's supported package-removal workflow. Requires a Pi version compatible with `@earendil-works/pi-coding-agent` `^0.84.2`, Node.js 22+, Git, and an interactive TUI.

## `/mgood:git-commit`: one-click current-Agent workflow

In an idle interactive Pi TUI, the command reads its packaged Prompt, treats any argument solely as textual guidance, and sends exactly one Pi custom context message with stable type `mgood-git-commit`, `display: false`, and `triggerTurn: true`. Invocation itself authorizes the current Agent to inspect the invocation current worktree and create commits within the Prompt contract. The handler does **not** inspect Git, invoke a provider/model planner, show a plugin confirmation, stage files, commit, or push. Busy, non-TUI, Prompt-read-failure, and send-failure paths perform no Git/provider work.

`display: false` hides this injected custom message from the TUI transcript; it is **not** a secret channel. The content still participates in the Agent context and may remain in local Pi session data or exports. The message has no `details` payload; it does not duplicate Prompt text, constraints, Git data, or credentials elsewhere.

The Agent quietly inspects status, staged/unstaged diffs, relevant untracked content, recent log, and relevant files. Only with a clean index (no staged paths) and purely unstaged/untracked whole-file candidates, it may use best-effort implementation semantics to form coherent Conventional Commit groups rather than directories or fixed counts. Absolute semantic proof is not required, but it must avoid obviously unrelated files. Existing staged/mixed content, operation/scope uncertainty, submodules/nested repositories, obvious secrets/private keys, and unrecognized/unsafe/generated content remain hard stops. A conventional project PNG is not rejected merely for being binary: when its exact path and repository role reasonably relate it to the feature, the Agent may stage it with related source, Markdown, configuration, lockfile, or other project resources.

It may commit groups it can reasonably classify. Any remaining exact paths that cannot be grouped without an obviously unrelated relationship stay uncommitted and are briefly reported; it never creates a default `chore` or consolidate-remainder commit.

On the normal path it uses precise commands such as `git add -- <exact paths>` and `git commit -m <message>`, re-checks drift/staged membership, lets hooks run, and stops on drift, unexpected staging, cancellation, hook failure, or partial execution. It must not use broad/destructive/history-rewriting commands, modify source to prepare commits, or push automatically. Normal success contains only a short completion plus each created short SHA/message—no plan, confirmation, path list, rationale, or diff. A safe stop/partial failure must briefly state its cause, created SHA/messages, and final `git status --short` summary.

This is a behavioral protocol, **not a capability sandbox**: Pi tools, shells, hooks, credential helpers, and external processes retain local-user privileges.

## `/mgood:git-commit-push`: confirmed commit-and-push workflow

This command now has the same current-Agent workflow model as commit and commit-push-PR. It accepts optional natural-language constraints, asks for one explicit TUI confirmation, then injects a hidden Prompt that performs: inspect → if currently protected, automatically `git switch -c` a descriptive feature branch before staging → exact-path Conventional Commit(s) → push only that non-protected branch. It must never push to `main`, `master`, `dev`, or `develop` (case-insensitive), force-push, change Git configuration, push tags, delete refs, or rewrite history.

## `/mgood:git-commit-push-pr`: confirmed feature-branch workflow

This workflow uses the same confirmation and safe commit/push boundary as `/mgood:git-commit-push`, then creates one pull request with `gh pr create`. The sequence is: inspect → if currently protected, automatically `git switch -c` a descriptive feature branch before staging → exact-path Conventional Commit(s) → push only that non-protected branch → `gh pr create`. Protected branches can be PR bases but never push destinations. It stops on unsafe repository state, push failure, or PR failure and never force-pushes, merges, or rewrites history.

## Non-interactive behavior and recovery

The extension starts no timers, watchers, processes, or network connections when loaded. Commit launch in print/JSON/RPC-like modes, missing UI, busy Agent, or Prompt-read failure fails closed with no injection. Commit-and-push and commit-push-PR launches in non-interactive mode fail closed with no injection or mutation. Errors identify safe remediation without exposing credentials.

## Manual verification

Only use an authorized disposable repository and local bare remote—not the development checkout or a live remote. In a real Pi TUI, verify one command creates semantic multi-commits without preview/confirmation/file list; no-change; staged and mixed-state safe stops; drift; hook partial failure; narrow terminal; no automatic push from `/mgood:git-commit`; confirmed feature-branch commit-and-push; and confirmed commit-push-PR. Capture redacted transcript, executed argv, and Git before/after evidence. Unit tests verify the launcher and core push contracts only; they do not prove live-Agent compliance.

See [the feature guide](../../docs/features/git/README.md), [command contract](../../docs/plugin-contracts/git-commands.md), and [security review](../../docs/security/git-commands.md).
