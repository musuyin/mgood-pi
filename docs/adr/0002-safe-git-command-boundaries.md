# ADR 0002: Bound safe Git commands to approved commit and push operations

- **Status:** accepted
- **Date:** 2026-09-21

## Context

Pi users can invoke arbitrary Git commands through a general shell, but that route does not supply an operation-specific preview, interactive approval, or a constrained destination. This kit needs a narrow, user-invoked workflow for committing an already staged index and pushing the checked-out branch.

The initial V1 request used `/git-commit <message>` and `/git-push`. They were intentionally short names at that point; the superseding v2 naming decision is recorded below.

## Decision

Implement the feature as two independently installable TypeScript packages:

- `packages/git` owns framework-neutral repository inspection, operation preparation, immutable previews/fingerprints, policy validation, argv-only Git execution, redacted typed errors, and revalidation.
- `plugins/git` is a thin Pi adapter that registers the two user commands, gates each command on an interactive UI, presents the complete preview, requests confirmation, and invokes the matching core operation once.

The extension factory has no ambient timers, watchers, subprocesses, or network activity. It registers no model-callable Git mutation tools and no lifecycle-triggered mutation behavior.

### Commit boundary

The commit command accepts one non-empty, non-NUL message as data. It may commit only the index that already exists at preview time. It never stages, unstages, selects paths, amends, invokes an editor, bypasses hooks, or changes signing policy.

Preparation rejects a non-repository, detached `HEAD`, active sequencer operation, empty index, or conflicted index. The preview identifies the repository and branch/HEAD, displays the complete message, staged path and summary data, counts excluded unstaged/untracked entries, and warns that configured hooks may run. Immediately before `git commit -m <message>`, the core revalidates the index, `HEAD`, branch, and operation state. Any drift invalidates approval and requires a new preview.

### Push boundary

The push command takes no destination or force arguments. It may push only the current attached local branch to the configured upstream recorded by `branch.<name>.remote` and `branch.<name>.merge`. It derives an explicit fully qualified refspec from those values; it does not rely on `push.default`.

Preparation rejects detached or unborn `HEAD`, active sequencer state, missing or malformed upstream configuration, unknown/ambiguous remote data, and destinations that are not branch refs. The preview identifies the repository, remote name and credential-redacted URL, local and destination refs, current commit, exact refspec, and locally determinable transfer range or its uncertainty. It warns that transport, credential helpers, server policy, and hooks may have effects outside the plugin. Before one `git push --porcelain <remote> <refspec>` attempt, the core revalidates `HEAD`, branch, upstream, remote identity, and destination. Drift invalidates approval.

Both mutations require a fresh, explicit affirmative interactive confirmation. Cancellation, denial, unavailable UI, non-interactive mode, failed validation, or failed revalidation performs no mutation. Approval is one-use only and is not a reusable token or an authorization secret.

## Alternatives considered

- **Use Pi's general bash tool or an unrestricted shell wrapper:** rejected because arbitrary commands and destinations cannot provide the feature's narrow authority, structured preview, or reliable approval boundary.
- **Expose model-callable commit/push tools:** rejected because V1 is deliberately human-invoked and interactive; unattended mutation has no approved confirmation protocol.
- **Stage changes automatically or use `git commit -a`:** rejected because the commit must contain exactly the pre-existing index and must leave unstaged/untracked content unchanged.
- **Push to `origin`, infer a default, or set an upstream:** rejected because destination ambiguity is unsafe; V1 uses only explicit branch configuration and never changes it.
- **Offer force, tags, deletion, fetch/pull, retry, or recovery automation:** rejected because these broaden authority, can make remote outcomes uncertain, or are outside V1.
- **Make the public names namespaced:** rejected for V1 because the product requirement requested the two exact names. This was superseded by the v2 naming decision below.

## Consequences

- The package/plugin split preserves reusable Git policy without coupling it to Pi APIs and keeps extension registration thin.
- Every Git subprocess uses an argument vector and explicit working directory; user values are never interpolated into shell syntax. Input, refs, and control characters are validated; machine-readable Git output is parsed safely; output, duration, and cancellation are bounded.

## Superseding decision: v2 command namespace and Pi API boundary

On 2026-09-21, the user chose `/mgood:git-commit <message>` and `/mgood:git-push` as the only public commands. The old short names are not compatibility aliases. This preserves the commit/push authority, preview, confirmation, revalidation, subprocess, and trust-boundary decisions above while aligning with the repository command namespace convention.

> **Superseded command name (2026-09-30):** the active public command is now `/mgood:git-commit-push`, reflecting its commit-and-push workflow. `/mgood:git-push` is not retained as an alias. The historical v2 decision above remains an accurate record of its original contract.

The extension registers each namespaced command once. Pi's public API permits same-name extension commands to coexist with numeric invocation suffixes; `pi.getCommands()` does not provide a complete inventory of built-in interactive commands. Consequently, the plugin must not promise to detect all built-in conflicts or override Pi's suffix behavior. Namespacing lowers collision probability, and tests must record actual discoverable registration behavior.

Pi command contexts can omit `signal` outside an active agent stream. The core therefore accepts an optional caller `AbortSignal`, while every Git process independently enforces timeout, output limits, terminal-prompt disablement, and redacted errors. This does not weaken failure-closed confirmation requirements.

- The core disables terminal credential prompts and redacts credential-bearing URLs and diagnostics. It neither reads nor stores credentials or environment secrets.
- Hooks, credential helpers, transport, server policy, general Pi bash, the user shell, other extensions, aliases, and concurrent external processes remain outside this plugin's enforcement boundary. The plugin documents those limits rather than claiming a sandbox.
- Failure is reported with redacted, actionable remediation and without automatic retry. A hook or remote outcome may be uncertain after an interrupted execution, so the user must inspect repository/remote state before trying again.
