# ADR 0004: Evolve safe commit into an agent-planned, deterministically executed workflow

- **Status:** accepted (implementation verification in progress)
- **Date:** 2026-09-28

## Context

ADR 0002 deliberately limited `/mgood:git-commit <message>` to the index already staged by the user. That boundary made one commit easy to preview and revalidate, but it does not satisfy the desired workflow: inspect an existing mixed worktree, infer repository conventions, split changes by feature/module/dependency, generate Conventional Commit messages, include suitable untracked files, honor natural-language and explicit exclusions, and execute the reviewed sequence after one final confirmation.

This change materially expands local authority. The plugin will need to read selected diff and history data, invoke the current Pi model for semantic planning, modify the index for exact paths, and create multiple commits. Model output is probabilistic and cannot itself be the authorization boundary. Git hooks and concurrent processes can also change state between commits, so the sequence cannot honestly be presented as atomic.

## Decision

Keep the existing package boundary while separating semantic proposal from deterministic authority:

- `plugins/git` owns the human-invoked TUI command, bounded prompt construction, invocation of the current Pi model through a testable planning interface, complete plan presentation, and one final affirmative confirmation.
- `packages/git` owns repository discovery, candidate and history snapshots, special-file policy, path/glob validation, a versioned TypeBox plan schema, deterministic plan validation, fingerprints, exact-path index operations, per-step revalidation, Git execution, and partial-success results.
- The model may propose groups, ordering, messages, and a structured interpretation of natural-language constraints. It cannot add paths outside the core-owned candidate set, override explicit excludes, split a path by hunk, authorize a mutation, or emit arbitrary Git arguments.

`/mgood:git-commit [constraints] [--exclude <glob> ...]` remains manually invoked and TUI-only. The command gathers a bounded snapshot, requests a structured proposal, validates it deterministically, displays every group/path/message/exclusion/risk, revalidates the complete baseline, and asks once for final confirmation. That one confirmation authorizes only the displayed ordered plan.

### Index ownership

The index present when planning begins remains user-owned. If non-empty, its exact tree becomes an indivisible first `user-prestaged` commit. The model generates its message but cannot mix other content into it or exclude part of it. A path with both staged and unstaged content contributes its staged version to that first commit; its remaining worktree version can be a later whole-path candidate.

For later groups, the core stages only validated, explicit repository-relative paths. It never uses `git add .`, `git add -A`, shell expansion, `commit -a`, or free-form model/user Git arguments. Before each commit it proves the index contains only the intended group, then verifies the resulting commit SHA/tree/path set before advancing.

### Plan and message policy

The model receives a bounded, redacted representation of status, selected diffs and recent history. Binary content, suspected secrets and over-limit content are not sent. It returns a versioned structured plan. Conventional Commit type comes from an allowlist; language and scope are inferred from history, with English as the language fallback and optional scope when evidence is insufficient. Breaking-change syntax requires supporting diff evidence and an explicit reason.

Explicit `--exclude` uses a documented repository-relative glob subset and always wins. Natural-language constraints must be rendered as structured path/group/order intent and validated against the candidate set. Ambiguous or contradictory intent fails closed and asks the user to clarify.

### Failure and recovery

The sequence is intentionally non-transactional. Each normal Git commit runs configured hooks. Any hook failure, cancellation, state drift, unexpected index/worktree mutation, or result mismatch stops the sequence. Successful commits remain. The plugin never automatically resets, rewrites, retries, reorders, or replans. It reports successful SHAs, the failed group, current repository/index state and unexecuted groups; the user inspects or repairs the repository and starts a new plan.

`/mgood:git-push` retains ADR 0002's configured-upstream-only boundary. No broader push authority is introduced.

## Alternatives considered

- **Keep existing-index-only commit:** rejected as the sole workflow because it does not provide semantic grouping, generated messages or untracked-file handling requested by the user.
- **Let the model call Git directly:** rejected because arbitrary commands and probabilistic path selection cannot serve as a permission boundary or support deterministic replay/revalidation.
- **Commit everything as one fallback group:** rejected because it silently defeats requested grouping and can hide invalid model output.
- **Use `git add -A` and reset between groups:** rejected because broad staging and automatic cleanup can capture or overwrite unrelated user work.
- **Use a temporary index or hidden worktree and then rewrite commits:** deferred/rejected for the initial implementation because it complicates hook semantics, worktree-relative behavior and recovery; the approved design operates visibly on the real index with strict checks.
- **Automatically roll back completed commits on failure:** rejected because reset/history rewriting can destroy or obscure concurrent user work and cannot reliably reverse hook side effects.
- **Confirm every commit separately:** rejected by the product decision for one final confirmation of a fully visible ordered plan; per-step revalidation, not repeated approval, controls drift.
- **Allow hunk-level splitting:** deferred because safely composing and restoring partial index states materially expands complexity and recovery risk.

## Consequences

- ADR 0002 remains the historical basis for package separation, argv-only execution, confirmation, revalidation, redaction and the push boundary; its existing-index-only commit decision is superseded by this ADR only when requirements v3 is implemented and accepted.
- The plugin becomes model-dependent for commit planning and must disclose that selected repository data is sent to the user's current Pi provider. Deterministic validation remains mandatory even when the model is trusted.
- Partial success is a normal, documented outcome. Tests and TUI must make current index/worktree state observable rather than implying atomic rollback.
- Exact-path staging, staged/unstaged overlap, deletions, renames, hooks and unusual filenames require dedicated integration tests in disposable repositories.
- Work Plan 003 was approved on 2026-09-28 and implementation began under this ADR. It remains an implementation contract, not a released capability, until documentation, real TUI/provider acceptance, package validation, and independent Plan Review have actual recorded evidence. This does not change Work Plan 002's independently blocked review status.
