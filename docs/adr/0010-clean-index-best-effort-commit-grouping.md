# ADR 0010: Allow best-effort whole-file commit grouping only with a clean index

- **Status:** proposed
- **Date:** 2026-09-29

## Context

The v7/v8 one-click current-Agent commit workflow correctly fails closed when it cannot establish a safe whole-file grouping. This protects an existing staged or mixed index, but is too conservative for the common case of a clean index with many entirely unstaged or untracked files from one development session. The user wants useful functional commit splitting in that narrow case without reintroducing broad staging, hunk staging, a core executor, or automatic cleanup.

The extension is a thin hidden custom-message launcher. It cannot technically prove semantic correctness or sandbox the Agent. The Agent's Prompt remains the behavioral contract; standard Pi tools, Git hooks and local processes retain local-user authority.

## Decision

For v9, permit the current Agent to make a best-effort functional grouping only when the invocation current worktree has a clean index with no staged paths and the candidates are purely unstaged and/or untracked whole files.

In that state, the Agent may use current session intent, diffs, source relationships, logical dependencies and commit style to group reasonably related files, including across directories. It need not prove that every grouping is semantically perfect, but must avoid obviously unrelated files and must not use directory or file-count batching.

All existing hard stops remain mandatory. The Agent stops before mutation for any staged/mixed state, conflict or sequencer state, submodule/nested repository, unsafe repository scope, obvious secrets/private keys, unrecognized or unsafe-to-read content, or a file whose unrelated changes require hunk splitting. A conventional project PNG is not itself a hard stop: the Agent may group it with related source, Markdown, configuration, lockfile, or other project files when its exact path and repository role provide a reasonable feature relationship. Execution still uses explicit direct paths only (`git add -- <paths>`), rechecks state before every commit, and forbids broad/destructive Git, history rewrite and automatic push.

After committing the files it can reasonably classify, the Agent must stop for an ambiguous remainder. It reports the remaining explicit paths and reason, rather than creating a default `chore: consolidate remaining workspace changes` commit. The user selected this fail-closed remainder policy to avoid silently recording an uncertain history.

## Alternatives considered

- **Keep absolute evidence-or-stop for every clean-index file:** rejected because it leaves routine, obviously related development changes unnecessarily uncommittable.
- **Always create a remainder/consolidation commit:** rejected by the user because it can hide weakly related files and degrade history quality.
- **Require a special command argument for remainder commits:** rejected for this iteration; it adds public command semantics while the selected default is safe stop.
- **Permit staged/mixed state using index recovery:** rejected because existing index protection remains a hard boundary and no new index mutation authority is intended.
- **Restore provider planner, deterministic batching or core commit executor:** rejected because current-Agent contextual judgment is the chosen architecture.

## Consequences

- Clean-index development sessions gain practical whole-file functional splitting without promising perfect semantics.
- The Agent can create a partial sequence of well-classified commits and then deliberately leave ambiguous paths untouched.
- Real Pi TUI/disposable-repository tests are required to observe the Agent's behavior; unit tests only prove Prompt and launcher contracts.
- This is a new requirements baseline and Work Plan because it materially changes the v8 safety/behavior contract. WP001–WP008 remain immutable; v8 hidden-message visibility semantics are unchanged.
