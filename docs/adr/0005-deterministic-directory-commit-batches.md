# ADR 0005: Use deterministic adaptive-directory commit batches and rebuild the index after confirmation

- **Status:** proposed
- **Date:** 2026-09-28

## Context

ADR 0004 introduced an agent-planned multi-commit workflow in which the model proposed complete file groups, ordering, and messages while the core validated the proposal. Work Plan 003 began implementing that design, including a 200-candidate bound and an indivisible `user-prestaged` first group. It has not completed independent review or real TUI/provider acceptance.

The revised product direction requires predictable scaling to hundreds of files without giving a probabilistic component ownership of file boundaries. A commit may contain at most 100 files, a plan may contain at most 1000 candidates, and the extension must derive groups from the shallowest directory subtrees that fit the batch limit. Existing staged and unstaged states must participate in the same grouping. Clearing or rebuilding the index is itself a Git mutation, so it cannot occur while producing the preview and must be explicitly disclosed by the single final confirmation.

## Decision

Supersede ADR 0004's model-owned grouping and immutable prestaged-first decisions with the following v4 commit contract. Preserve ADR 0002's package split, argv-only execution, explicit confirmation, revalidation, redaction, and configured-upstream-only push boundary.

### Deterministic candidate and batch authority

`packages/git` owns one classified whole-path candidate set covering staged, unstaged, and eligible untracked changes. After deterministic exclusion, it recursively partitions candidates from the repository root:

1. A directory subtree containing at most 100 candidates is one batch and is not split further.
2. A subtree above 100 candidates is traversed through its direct child directories.
3. Files directly under the current directory, and other remainder not wholly covered by child subtrees, are sorted by normalized repository-relative path and chunked by 100.
4. A leaf directory above 100 candidates is sorted and chunked by 100.
5. Directories, remainder paths, and chunks use one documented repository-relative lexicographic ordering, so identical input produces identical membership and order.

The total pre-filter candidate bound is 1000; exceeding it fails before provider use or mutation. A plan therefore contains at most ten commit batches. Natural language may only resolve unambiguous keep/exclude path rules and cannot modify batching or ordering.

### Message-only model role

`plugins/git` may ask the current selected Pi model for a Conventional Commit message for each already-fixed batch using bounded, redacted evidence. The model cannot return candidate membership, ordering, or Git arguments. Core validates every message. Provider absence, timeout, cancellation, invalid output, or a per-batch failure produces a deterministic, visibly marked fallback such as `chore(src/api): update 63 files`; root batches use `chore: update 18 files`. All messages and their sources are fixed before preview and confirmation.

### Confirmation and index ownership

Planning is read-only. The complete TUI preview discloses the original staged state, exact candidates and exclusions, ordered batches and messages, and that confirmation authorizes clearing the current staged state and rebuilding it according to the plan. Rejection, cancellation, UI failure, or pre-execution drift performs no Git mutation.

After one affirmative confirmation, core may use only fixed direct-argv, exact-path index operations to remove the original staged entries while preserving worktree content, then stage each approved batch with `git add -- <exact paths>` and commit with `git commit -m <validated message>`. It never invokes a shell, `git add .`, `git add -A`, `commit -a`, `reset --hard`, `restore`, or `checkout`. Mixed staged/unstaged content for the same path must be preserved as the final whole-path candidate or fail closed before mutation if that cannot be proven.

Each normal commit runs hooks. The executor revalidates before the first write and around every batch, reports concise progress without another confirmation, and verifies resulting SHA/tree/path membership. Hook failure, cancellation, drift, or mismatch stops the sequence. Successful commits remain; there is no automatic rollback, index restoration, retry, replan, amend, or history rewrite. The result reports the actual HEAD/index/worktree and all unexecuted paths, including whether the original staged state was already cleared.

`/mgood:git-push` never follows commit automatically. It remains a separately invoked and separately confirmed configured-upstream-only operation without force or arbitrary remote/ref arguments.

## Alternatives considered

- **Direct-parent directory buckets:** rejected because small nested trees would be fragmented even when their shallow common subtree safely fits one commit.
- **Fixed first-level buckets:** rejected because large first-level trees need deterministic recursive splitting and the provided product examples distinguish their child modules.
- **Model-proposed groups with deterministic validation:** superseded because validation limits authority but does not provide the requested stable, reproducible directory partition.
- **Keep the original staged index as an indivisible first commit:** superseded because staged and unstaged candidates now use one deterministic grouping contract; retaining it could also violate the 100-file batch limit.
- **Mutate the index before preview to simplify planning:** rejected because unstaging is a write and would precede authorization.
- **Require the provider for every message:** rejected because deterministic fallback preserves the fixed plan and remains visible before confirmation.
- **Restore the original index automatically on failure:** rejected because hooks and successful commits make rollback non-atomic and automatic restoration can overwrite concurrent or hook-produced state.

## Consequences

- Requirements v4 and Work Plan 004 must replace, not edit, the already-started v3/WP003 design. WP002 and WP003 evidence remains historically accurate and independently unresolved.
- Exact-path index clearing is a new local write authority and requires explicit command/security documentation, typed results, unusual-path tests, mixed staged/unstaged fixtures, and real TUI disclosure.
- The model receives less authority and less data per request, but up to ten bounded message requests may occur; cancellation, timeout, aggregate payload, and fallback behavior must be explicit.
- Directory-based commits optimize determinism and operational scale rather than semantic cross-directory feature cohesion.
- This ADR remains `proposed` until implementation, disposable-repository evidence, real Pi TUI/provider acceptance, packaging checks, and an independent Plan Review pass.
