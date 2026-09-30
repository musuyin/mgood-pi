# ADR 0003: Use a lightweight local Plan Workflow

- **Status:** accepted
- **Date:** 2026-09-23

## Context

The previous repository-managed Feature → Work Plan → Phase → Review model required repeated create, approval, execution, and remediation cycles. It was disproportionate for ordinary coding tasks, where implementation discoveries and small corrections should stay within one active plan.

Plans are primarily temporary assistance for the local coding session. Stable conclusions can be turned into committed documentation later, but the planning workflow must not require Git-tracked project-management records.

## Decision

Use a hybrid local workflow:

- `packages/plan-workflow` is framework-neutral and read-only. It discovers Schema v5 local plans under the fixed `tmp/work-plans/` root and validates canonical paths.
- `plugins/plan-workflow` is a thin Pi adapter. It registers one TUI-only command, `/mgood:plan`, and dispatches hidden custom session messages for planning, execution, and review.

Each local feature has exactly two workflow files:

```text
tmp/work-plans/<feature-slug>/
├── PLAN.md
└── REVIEW.md
```

`PLAN.md` is a living plan with a checklist and adjustment log. Small corrections are made in place. `REVIEW.md` is append-only; a `changes-needed` verdict adds focused work back to the same Plan rather than creating a remediation hierarchy.

The plugin does not modify `.gitignore`, Git state, dependencies, or formal project documentation. Users choose whether `tmp/` is ignored and explicitly ask an agent to derive stable conclusions into repository documents.

The only supported root is `tmp/work-plans/`. The runtime does not scan, load, or mutate legacy repository-root `work-plans/` records or any configurable/recursive alternative.

## Consequences

- One public command replaces make/list/approve/do/review subcommands.
- No Work Plans, phases, approval states, supersession, immutable review trees, or repository-local plan audit records exist in the current runtime.
- Local plan state can survive Pi sessions in the worktree but is normally Git-ignored.
- Hidden custom messages remain in session/LLM context without exposing the internal prompt as user input.
- Existing repository-root historical plan data is not deleted or migrated by the workflow; it is simply outside the current runtime contract.
