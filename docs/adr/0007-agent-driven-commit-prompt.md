# ADR 0007: Use the current Agent through a packaged commit-workflow prompt

- **Status:** accepted
- **Date:** 2026-09-28

## Context

The initial draft of requirements v6 and Work Plan 006 proposed a second model-planning layer inside the Git plugin: the plugin would gather candidates, call the selected provider, parse semantic groups and execute a core-validated prepared plan. That repeated capabilities the current Pi Agent already has. The Agent knows the conversation's implementation intent and can inspect status, diffs and repository conventions with its standard tools.

The actual product need is a discoverable `/mgood:git-commit` shortcut that consistently reminds the current Agent to inspect all relevant changes, split them by feature, write Conventional Commit messages, show the complete plan, wait for approval and then commit. It is not a request for a separate batching engine or provider invocation.

## Decision

`@mgood-pi/plugin-git` will retain the namespaced `/mgood:git-commit` extension command as a thin workflow launcher. On invocation, the handler loads a private packaged Markdown prompt, substitutes the user's optional textual guidance, and uses Pi's public `sendUserMessage()` API to inject it as an actual user message into the current session.

The command must run only when the Agent is idle and an interactive confirmation flow is possible. It does not inspect Git, call `modelRegistry.complete()`, build a commit plan, confirm a plan or mutate the repository itself. The injected turn uses the current session's selected model, conversation context and enabled standard tools.

### Agent planning authority

The prompt delegates commit planning to the current Agent. The Agent inspects the invocation worktree's status, staged and unstaged diffs, relevant untracked content and recent commit style. It decides the number of commits, exact whole-file membership, order and Conventional Commit messages based on feature cohesion and logical dependencies. There is no preliminary directory/file-count batching and no product-level candidate, group-size or commit-count limit.

Physical model context and tool-output limits still exist. If the Agent cannot inspect enough evidence to understand all relevant changes, it must stop and explain how the user can narrow scope; it must not silently truncate evidence and commit.

### Human authorization and execution guidance

The first Agent turn is read-only. It presents the complete ordered plan with exact paths, messages and short rationales, asks for one explicit approval, and ends without staging or committing. Only a subsequent affirmative user message authorizes the displayed plan.

After approval, the Agent uses direct exact-path staging and ordinary commits, checks staged membership before each commit, and verifies status after each result. The prompt prohibits broad staging, destructive reset/restore/checkout/clean/stash, history rewriting and automatic push. Drift, hook failure or unexpected staged content stops execution; successful commits remain and the Agent reports actual partial state.

These constraints are behavioral instructions to the Agent, not a core-enforced capability sandbox. Pi's standard bash tool, hooks and external processes retain local-user privileges. Documentation must state this limitation plainly. The former `/mgood:git-push` configured-upstream-only command was later superseded by confirmed Agent-driven `/mgood:git-commit-push`; see the active Git command contract.

### Architecture simplification

The commit path no longer performs a second provider call or uses plugin/core candidate batching, proposal schemas, prepared-plan validation or commit-sequence execution. Commit-only code and dependencies should be removed after auditing consumers; push functionality and genuinely shared Git utilities remain. The package includes the private prompt in its published file allowlist.

## Alternatives considered

- **Pure Pi prompt template:** viable but rejected because the product requires the existing namespaced extension command and a private packaged workflow without a duplicate template command.
- **Second model call with semantic proposal validation:** rejected because it duplicates the current Agent, loses useful session context and creates unnecessary schemas, limits and orchestration.
- **Deterministic directory batching plus message-only LLM:** rejected for this workflow because directory/file-count boundaries do not represent feature semantics.
- **Let the command handler execute Git directly:** rejected because the desired planner and operator is the current Agent, with a visible two-turn approval protocol.
- **Claim Prompt rules are enforced permissions:** rejected as inaccurate; hard enforcement would require a separate tool/permission design.

## Consequences

- The workflow becomes smaller and more aligned with Pi's agent-first design: one slash command starts a reusable current-Agent procedure.
- Commit quality benefits from session context, but planning and policy compliance remain model-dependent rather than deterministically guaranteed by core.
- Removing product-level count limits does not remove physical context limits; insufficient evidence causes a visible stop before mutation.
- Requirements v6 and draft Work Plan 006 require a material revision. The abandoned initial draft direction is recorded in Feature HISTORY; approved WP005 and earlier evidence remain immutable.
- ADR 0005 and ADR 0006 remain historical descriptions of the v5 core-managed workflow. This ADR supersedes them only for the v6 `/mgood:git-commit` behavior; the separate push boundary remains.
- This ADR remains `proposed` until real Pi TUI evidence, package validation and independent Plan Review pass.
