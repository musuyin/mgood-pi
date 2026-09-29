# ADR 0006: Scope index rebuilding to the current attached worktree

- **Status:** proposed
- **Date:** 2026-09-28

## Context

Requirements v4 and Work Plan 004 authorized a read-only preview followed by exact index clearing and deterministic restaging after one confirmation. During implementation, WP004 correctly failed closed because its allowlist did not name a concrete index-clear command and its contract did not distinguish the current worktree index from other linked worktrees. That ambiguity was recorded in WP004 Phase 1 RESULT; the old evidence must not be rewritten.

Git linked worktrees share repository objects and refs but have worktree-specific administrative state and indexes. The intended product scope is narrower than “the repository”: the invocation's current worktree, its attached branch and its own index. A user's manually staged paths in that index may be unstaged and deterministically regrouped, but unstaging is itself a write and cannot happen before the complete preview and confirmation.

## Decision

The commit workflow resolves its scope from the invocation `cwd` with `git rev-parse --show-toplevel`. It requires an attached HEAD and captures the current branch, HEAD, worktree root, per-worktree Git directory/index identity, and the common Git directory identity needed to detect scope substitution. Candidate discovery and mutation operate only through that resolved worktree root and its index.

The workflow does not enumerate or inspect `git worktree list` to collect other worktrees. It does not read, clear, stage, commit, lock or otherwise manage another linked worktree's index, HEAD or files. Changes in unrelated linked-worktree indexes and worktree files are outside the prepared fingerprint and do not invalidate the plan. Changes that affect the current worktree's branch/HEAD, its index/candidates, or shared unsafe repository operation state still invalidate it.

### Approved index-clear primitive

Planning and preview remain read-only. The complete preview names the current worktree/branch, lists the staged paths captured by the snapshot, and states that confirmation authorizes unstaging those exact paths and rebuilding the current index.

After that single affirmative confirmation and a full revalidation, core may execute this fixed direct-argv shape for a repository with HEAD:

```text
git reset -- <exact staged paths>
```

The path list comes only from the validated current-worktree snapshot. A `--` separator is mandatory. The command must never omit pathspecs and must never use `--hard`, a tree-ish supplied by a user/model, shell interpolation, glob expansion or paths from another worktree. The executor then re-reads the current index and worktree before any `git add -- <exact batch paths>`.

For an unborn repository, implementation may use only an exact-path equivalent whose argv and data-preservation behavior are separately allowlisted, previewed and proven by disposable-repository tests. If no safe compatible primitive is available, the workflow fails before its first mutation. This exception cannot become a broad index reset.

The primitive changes index state, not worktree file bytes. Staged-only, mixed staged/unstaged, additions, deletions, renames and unusual paths require before/after blob, index and filesystem assertions. Any mismatch stops execution and is reported as partial state; there is no automatic restoration of the original index.

### Isolation and recovery

Integration tests create at least two linked worktrees on distinct branches with independent staged and unstaged changes. Running the workflow in one target worktree must leave the other's HEAD, index tree and file bytes unchanged. The tests also prove that unrelated changes in the other worktree do not create false drift, while changes to the target worktree identity, branch, HEAD, index or candidate state fail closed.

Hooks, cancellation, drift and failures after index clearing retain the v4 non-transactional contract: successful commits remain, later batches stop, and the result reports actual current-worktree HEAD/index/worktree state and unexecuted paths. No reset-based rollback, restore, checkout, stash, clean, retry or replan occurs.

`/mgood:git-push` remains a separate, separately confirmed configured-upstream-only operation and never follows commit automatically.

## Alternatives considered

- **Treat all linked worktrees as one planning scope:** rejected because each worktree has independent checkout and index state; cross-worktree mutation would be surprising and over-privileged.
- **Keep every staged index as an immutable first commit:** superseded by the approved v4 product behavior that stages and unstaged changes share deterministic directory batches.
- **Run `git reset` without exact paths:** rejected because it widens the write to the entire current index and can affect unplanned entries.
- **Use `git reset --hard`, `restore` or `checkout`:** rejected because these can alter worktree content and violate the data-preservation contract.
- **Silently unstage before preview:** rejected because the operation is a Git write not covered by user authorization.
- **Automatically restore the original index after failure:** rejected because successful commits, hooks and concurrent changes make such rollback unsafe and non-atomic.

## Consequences

- Requirements v5 clarifies the security boundary and supersedes v4. Work Plan 005 records the recovery work; it does not modify or erase WP004's blocked result.
- Core repository identity and fingerprints must distinguish the invocation worktree and its per-worktree index from the shared common Git directory.
- `git reset -- <exact paths>` becomes a narrowly allowed write only after confirmation. Documentation, argv tests, mixed-state fixtures and linked-worktree isolation evidence are mandatory.
- Detached HEAD and unverifiable worktree identity fail closed. Unborn repositories require an independently proven exact-path equivalent or remain unsupported for this workflow.
- This ADR remains `proposed` until implementation, isolated mutation evidence, real Pi TUI acceptance and independent Plan Review pass.
