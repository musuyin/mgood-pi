# ADR 0008: Authorize one-click current-Agent commits with concise output

- **Status:** proposed
- **Date:** 2026-09-29

## Context

ADR 0007 and approved WP006 changed `/mgood:git-commit` into a thin launcher for a current-Agent Prompt. The initial workflow was deliberately verbose: the Agent displayed every planned path, message and rationale, then waited for a second explicit user confirmation. Its Phase 1–2 implementation is complete; real TUI acceptance remains blocked.

The user finds that interaction too noisy. They want the Agent to read the diff and divide commits by implementation semantics, but a single slash command should finish the commits. The useful normal result is the created commit messages, not an itemized file plan.

## Decision

Create v7 as a new plan because WP006 is approved and partly executed. `/mgood:git-commit` remains an idle interactive thin extension launcher that injects a packaged Prompt as one real user message. Invoking the command is explicit authorization for the current Agent to inspect and create commits in the invocation current worktree; no second confirmation is requested.

The current Agent remains the only semantic planner and operator. It uses existing session context and standard tools to inspect Git evidence, decide whole-file commit membership/order/messages, then directly execute exact-path staging and ordinary commits. The plugin does not call another provider, parse a proposal, impose directory/file-count batches, or reintroduce a core commit executor.

The Prompt suppresses normal-plan verbosity. It does not print a plan, per-commit path list or rationale before acting. On success it reports only each created short SHA and message. It must still stop and concisely report no-change, uncertainty, unsafe pre-existing staged/mixed state, drift, hook failure or partial result. It must not automatically push.

Existing staged or mixed staged/unstaged states are a safety gate: if the Agent cannot prove exact whole-path staging preserves them without reset/rebuild/patch staging, it stops rather than guessing. The Prompt's rules remain behavioral guidance, not a capability sandbox.

## Alternatives considered

- **Keep v6 two-turn preview:** rejected for normal UX; it exposes excessive detail and interrupts one-click use.
- **Hide the preview but retain invisible confirmation:** rejected because it is confusing and does not meet one-click authorization.
- **Restore a core planner/executor for stronger enforcement:** rejected because it repeats prior complexity and loses current Agent context.
- **Commit every diff as one change:** rejected because the user explicitly wants semantic commit splitting.

## Consequences

- The command is faster and quieter but grants Git-write authority at invocation; documentation must make that explicit.
- Agent quality and prompt compliance remain model-dependent. Unsafe index/mixed state stops are intentional friction.
- WP006's two-turn contract, implementation evidence and blocked acceptance stay immutable. WP007 must independently validate v7, including real Agent behavior and concise output.
- `/mgood:git-push` remains unchanged: separate invocation, preview/confirmation and configured-upstream-only core guard.
