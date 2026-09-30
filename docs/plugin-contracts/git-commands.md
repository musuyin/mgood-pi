# Git Command Contract (v8 in progress)

> **Release status:** Work Plan 008 is approved and automated checks are in progress. Real Pi TUI and disposable-repository acceptance, isolated installation/load smoke tests, and an independent review are incomplete. This document describes the target contract; it is not a release claim.

## Scope and availability

The extension registers only these human-invoked namespaced commands:

```text
/mgood:git-commit [natural-language constraints]
/mgood:git-commit-push [natural-language constraints]
/mgood:git-commit-push-pr [natural-language constraints]
```

It provides no legacy alias or model-callable Git write tool. The extension factory starts no Git operation, network connection, timer, or watcher.

## `/mgood:git-commit [constraints]`

In an interactive TUI with an idle Agent, the handler reads a bundled Markdown prompt, removes front matter, inserts the optional remainder as plain text, and calls Pi public `sendMessage()` exactly once with `{ customType: "mgood-git-commit", content, display: false }` and `{ triggerTurn: true }`. It sends neither `details` nor `deliverAs`.

Invocation is the user's one authorization for the current Agent to inspect and create commits in the current worktree. The handler does not inspect Git, call a provider or `modelRegistry.complete()`, create a plan or candidate list, display a plugin confirmation, or execute any Git write. Non-TUI, missing UI, busy Agent, unreadable prompt, and send failure return a safe message with no partial injection or Git/provider work. Constraints are text, never shell or Git arguments. `display: false` hides the prompt from the TUI transcript but does not make it secret, nonpersistent, or sandboxed.

The injected prompt directs the current Agent to quietly inspect repository evidence and create best-effort exact-path, whole-file Conventional Commit groups only when the index is clean and candidates are unstaged or untracked. It must avoid obviously unrelated files, check drift and staged membership before every mutation, let hooks run, and stop on uncertainty, staged or mixed state, submodules or nested repositories, secrets/private keys, unsafe/generated content, cancellation, hooks, or other failures. It must not use broad staging, automatic hunk staging, reset/restore/checkout/clean/stash, amend/rebase/force, shell-generated path lists, history rewrites, automatic rollback/retry/replan, or push.

A normal success reports only short SHA/message entries and a concise completion state. A safe stop or partial failure reports its cause, completed SHAs/messages, and a final `git status --short` summary. This is an Agent behavior protocol, not a capability sandbox or core-enforced commit guarantee.

## `/mgood:git-commit-push [constraints]`

This command displays one explicit TUI confirmation before injecting a hidden current-Agent prompt. The prompt safely inspects the repository, automatically creates and switches to a meaningful unused feature branch when the current branch is protected, makes exact-path Conventional Commits, and pushes only that non-protected branch. Constraints remain plain text.

It must not force push, delete refs or tags, alter Git configuration, fetch, pull, retry, roll back, or rewrite history. A destination named `main`, `master`, `dev`, or `develop` (case-insensitive) is never allowed. If repository naming conventions do not provide a suitable name, the Agent uses `<type>/<short-lowercase-kebab-case-summary>`, such as `feat/git-commit-workflow`.

## `/mgood:git-commit-push-pr [constraints]`

This command has the same confirmation and safe branch/commit/push boundary as commit-push, then runs one `gh pr create`. Protected branches may be PR bases but never push destinations. Any unsafe state, drift, hook failure, push failure, or PR failure stops work without automatic retry or rollback.

## Permission boundary

| Capability                | Allowed boundary                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Commit launcher           | Load a private prompt and send one current-Agent custom message in an idle interactive TUI                             |
| Commit execution          | One authorized current-Agent behavior protocol; standard tools retain local-user privileges                            |
| Commit-push and commit-PR | One confirmation followed by a current-Agent prompt that may push only a non-protected feature branch                  |
| Prohibited in prompts     | Broad or destructive Git, automatic hunk staging, amend/force/rewrite, protected push, automatic rollback/retry/replan |
| Standalone push core      | Rejects arbitrary targets/argv, force, upstream/config rewrites, and protected destinations                            |

The standalone push subprocess uses direct argv, an explicit working directory, `GIT_TERMINAL_PROMPT=0`, bounded timeout/output, and redacted diagnostics. External side effects remain outside the plugin sandbox and are never rolled back automatically.
