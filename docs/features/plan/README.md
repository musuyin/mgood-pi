# Plan

Plan is a focused Pi planning mode that improves the quality of an implementation brief before any code changes begin.

## Command

```text
/mgood-pi:plan <request>
```

In TUI mode, the request may be omitted and entered when prompted. Non-interactive modes require it inline. `/mgood-pi:plan` does not change the active model.

## Planning protocol

The hidden bundled guidance directs the current agent to:

1. restate the intended outcome and known constraints;
2. actively question ambiguities that can alter scope, behavior, architecture, compatibility, migration, security, failure handling, or acceptance;
3. confirm the resolved brief and record any user-approved assumptions;
4. inspect repository instructions, source, tests, configuration, and documentation with read-only tools;
5. create one concise, implementation-ready Markdown plan.

Questions should expose product decisions rather than ask users for facts available in the repository. The agent may return to clarification if investigation reveals a decision that repository evidence cannot settle.

## Output contract

Each invocation creates one new descriptive file directly below:

```text
tmp/plans/<descriptive-slug>.md
```

There is no filename schema beyond a descriptive kebab-case name, and no YAML frontmatter or workflow schema. Existing files must not be overwritten.

A plan records the confirmed objective, scope and non-goals, decisions and assumptions, relevant current implementation evidence, ordered file-specific implementation steps, verification and edge cases, relevant risks or migration notes, and objective acceptance criteria. Sections that do not apply should be omitted rather than filled with boilerplate.

## Deliberate exclusions

Plan does not discover or parse plans, track status, maintain checklists as runtime state, resume implementation, run reviews, delete files, or create paired artifacts. It does not support the former `tmp/work-plans/` layout or `/mgood:plan` command. A generated plan is a document for a later implementation turn, not a workflow engine.

## Lifecycle and safety

`plugins/plan` owns the extension and bundled prompt; no shared core package is needed. Registration occurs once on `session_start`. The extension starts no background resource and needs no shutdown cleanup.

The prompt is sent as a hidden custom session message, so it remains in model/session context even though it is not rendered as user input. Its one-write boundary is behavioral guidance, not an OS sandbox. The output location is visible and normally ignored because this repository ignores `tmp/`. The plugin does not edit `.gitignore` or clean up generated plans on uninstall.
