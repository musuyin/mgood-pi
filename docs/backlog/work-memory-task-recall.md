---
title: Work Memory & Task Recall
state: parked
created: 2026-09-21
updated: 2026-09-30
priority: after-explicit-product-decisions
---

# Work Memory & Task Recall

## Idea

Build an opt-in long-term work memory and task-management capability for Pi. After work sessions, it stores a concise durable record of what changed, what remains, what is blocked, and what is nearly complete. In a later session, a greeting such as `hi` can offer a short recap and help the user resume without manually reconstructing context.

## Desired experience

1. At a session checkpoint or shutdown, propose a structured work summary.
2. Save only after explicit user approval, with visible project/workspace/user scope and storage path.
3. Maintain task states such as `planned`, `in_progress`, `blocked`, `finishing`, and `done`, with links to plans, task IDs, files, commits, or verification evidence.
4. On a new session, detect a greeting/explicit resume intent and offer:
   - recently completed work;
   - active and unfinished tasks;
   - blocked work and required decisions;
   - finishing tasks and suggested next action.
5. Let the user inspect, edit, delete, clear, export, and disable stored memory.

## Relationship to Plan

The focused `/mgood-pi:plan` command creates an implementation document, not durable task state or stable IDs. Work Memory therefore must own any future task identifiers and lifecycle records explicitly rather than infer them from temporary plan files. It may cite a plan path as provenance, but must not silently rewrite the plan.

Potential future commands:

```text
/mgood:remember-work
/mgood:recall-work
/mgood:work-status
/mgood:forget-work
```

A greeting-triggered recap should be an optional presentation policy over explicit memory records, not an excuse to inject all memories into every prompt.

## Likely implementation boundary

This is not just a Skill. Reliable greeting detection, session lifecycle, durable structured state, permission controls, and UI require a TypeScript Extension backed by reusable storage/task contracts, likely:

```text
packages/memory/        # versioned records, storage, retrieval, retention
plugins/memory/         # commands, opt-in session hooks, greeting/resume UX
```

A Skill or prompt template may help create summaries, but should not own storage or automatic lifecycle behavior.

## Privacy and safety constraints

- Opt-in, user-owned, local-first storage with visible scope and location.
- No silent source-code capture, hosted indexing, or background transmission.
- No implicit retrieval on every prompt. Greeting-triggered recall must be separately enabled and clearly disclosed.
- Summaries must show cited memory IDs/sources and redact secrets.
- Records require provenance, timestamps, schema version, retention, and delete/export controls.
- Session shutdown must not block indefinitely; failed writes must be recoverable and visible.

## Open product questions

- Does `hi` immediately display a recap, or offer a one-line “resume previous work?” action?
- Is the default scope project, workspace, or user?
- Which events create checkpoint proposals: explicit command, completed implementation turn, idle time, session shutdown, or Git commit?
- How are manually created tasks reconciled with temporary plan checklist items?
- What retention policy prevents stale tasks from becoming misleading?

## Promotion criteria

Do not start implementation until:

- `/mgood-pi:plan` has completed a real interactive smoke test;
- the memory scope, task ownership, retention, and greeting UX questions above are resolved;
- at least one real implementation session has documented recall friction this feature should solve;
- storage and permission contracts are designed independently of temporary plan files.

When ready, run:

```text
/mgood-pi:plan Design Work Memory using docs/backlog/work-memory-task-recall.md as context
```

Use the backlog file as input, revalidate all assumptions against current Pi APIs, and create a fresh implementation plan rather than treating this note as executable.
