# ADR 0009: Hide the injected commit workflow prompt from the TUI transcript

- **Status:** proposed
- **Date:** 2026-09-29

## Context

The v7 `/mgood:git-commit` launcher uses `pi.sendUserMessage(prompt)`. It correctly starts the current Agent's one-click semantic commit workflow, but Pi renders the long packaged Prompt as though the user had typed it. This makes the transcript visually noisy without adding useful user-facing information.

Pi's public extension API provides `pi.sendMessage()` for custom messages. Custom messages participate in LLM context and support `display: false`; when an Agent is idle, `triggerTurn: true` starts a turn. Unlike `sendUserMessage()`, the custom message is not a real user message. Hidden display is not a confidentiality primitive: custom messages can still be represented by session persistence, exports or local diagnostics.

## Decision

For the v8 commit launcher, replace the injected `sendUserMessage()` call with:

```ts
pi.sendMessage(
  {
    customType: "mgood-git-commit",
    content: prompt,
    display: false,
  },
  { triggerTurn: true },
);
```

The command remains limited to idle interactive TUI contexts. It does not use `deliverAs`, so a busy Agent is rejected instead of being steered, followed-up or queued. Prompt loading, frontmatter removal and literal optional-argument insertion stay unchanged. The handler continues to be a thin launcher: no Git inspection, provider call, confirmation or mutation occurs in extension code.

The `mgood-git-commit` custom type is stable for this package. No `details` payload is needed; it must not duplicate Prompt content, user parameters, diff data or secrets.

The v7 one-click Agent contract remains unchanged: command invocation authorizes the current Agent, which uses standard tools to inspect the current worktree, semantically split whole-file commits and execute exact-path Git operations. Normal success remains SHA/message-only; no automatic push occurs.

## Visibility and privacy boundary

`display: false` means the injected Prompt is suppressed from the TUI transcript. It does **not** mean that the Prompt, user-supplied constraints or any information placed in the custom message is secret, excluded from LLM context, absent from session storage, non-exportable, encrypted, or inaccessible to the local user and trusted extensions/processes. Documentation must make this precise.

## Alternatives considered

- **Keep `sendUserMessage()`:** rejected because it displays implementation Prompt text as a user message and degrades UX.
- **Use a TUI-only appended entry:** rejected because `appendEntry()` custom entries do not participate in LLM context and cannot start the Agent workflow.
- **Use `sendMessage()` with `display: true`:** rejected because it preserves the unwanted transcript noise.
- **Build a secret/non-persistent channel:** rejected as unsupported by this scoped UX change; it would require distinct persistence/security design and evidence.

## Consequences

- The transcript is cleaner while the current Agent receives the same workflow instruction.
- Session/export visibility must be documented as a residual local-data consideration, not hidden behind a misleading “private Prompt” claim.
- Mock tests prove call shape only; real Pi TUI evidence must prove hidden rendering and Agent turn triggering.
- WP007 is approved and partly executed; it remains immutable. v8 requires its own requirements baseline and Work Plan.
