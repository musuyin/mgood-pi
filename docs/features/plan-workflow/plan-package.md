# Local Plan Workflow package contract

## Fixed layout

```text
tmp/work-plans/<feature-slug>/
├── PLAN.md
└── REVIEW.md
```

The only supported root is `tmp/work-plans/`. The runtime does not discover repository-root `work-plans/`, custom roots, recursive roots, or legacy Schema v1–v4 layouts.

## PLAN.md

`PLAN.md` is the canonical local plan and uses Schema v5 frontmatter:

```yaml
---
title: <human title>
feature_id: <stable slug>
schemaVersion: 5
status: draft # draft|active|completed|abandoned
language: zh-CN # or en
created: <ISO-8601>
updated: <ISO-8601>
---
```

Its body contains the current goal, scope, non-goals, ordered checklist, confirmed decisions, blockers, and an append-only adjustment log. Checklist states are `[ ]`, `[>]`, `[!]`, and `[x]`.

The plan is intentionally mutable local state. Small changes within the feature goal are made in place and recorded in the adjustment log. Material changes to public behavior, compatibility, architecture/security, or acceptance require an explicit user decision before the plan changes.

## REVIEW.md

`REVIEW.md` is one append-only local acceptance record. Each dated section has one verdict: `pass`, `changes-needed`, or `blocked`, plus evidence/checks, unresolved issues, and next action. A `changes-needed` verdict adds focused work to the same PLAN; it does not create a new plan, phase, remediation object, or immutable review tree.

## Ownership and safety

`packages/plan-workflow` is framework-neutral and read-only. It validates directory containment with canonical `realpath`, parses Schema v5 `PLAN.md`, and exposes local summaries/checklist counts.

`plugins/plan-workflow` owns `/mgood:plan` and TUI actions. It may create/update/delete only the selected local workflow files through the model-guided workflow or an explicit discard confirmation. It must not modify `.gitignore`, Git state, dependencies, implementation files outside the model's normal explicitly selected work, or formal project documentation automatically.

Local plans are not committed workflow data. Users can explicitly ask an agent to derive stable conclusions from PLAN/REVIEW into repository documentation when appropriate.
