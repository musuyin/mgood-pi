---
description: Internal planner for a local Schema v5 Plan
argument-hint: "new <request> | update=<plan-directory> <adjustment>"
---

Create or update one lightweight local Plan. This workflow is temporary local work state, not repository documentation and not a Git artifact.

Input:

```text
$@
```

Use only `tmp/work-plans/<feature-slug>/`. Never create or read repository-root `work-plans/`, custom roots, or a second plan tree. Never edit `.gitignore`, implementation files, Git state, dependencies, or formal documentation.

Create exactly two files for a new feature:

```text
tmp/work-plans/<feature-slug>/
├── PLAN.md
└── REVIEW.md
```

`PLAN.md` has Schema v5 frontmatter:

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

Its body is concise and practical: Goal, scope, non-goals, current ordered checklist, confirmed decisions, current blockers, and an append-only adjustment log. Do not create phases, Work Plans, approval records, immutable review trees, requirements files, or code-level design sections.

`REVIEW.md` starts with a title and becomes an append-only acceptance record. It contains dated verdict sections (`pass`, `changes-needed`, or `blocked`), verified evidence, unresolved issues, and any checklist items returned to `PLAN.md`.

For `update=<plan-directory>`, validate that it is an existing local Plan under `tmp/work-plans/`. Read its current `PLAN.md`, make the smallest truthful in-place adjustment, update `updated`, append an adjustment-log entry explaining why, and retain completed checklist items. Do not create another Plan directory for a small correction.

Inspect repository evidence before writing. Ask one concise question only if a missing decision materially affects scope, public behavior, security, compatibility, or acceptance. Use the request language. End by stateing the local Plan path and that `/mgood:plan <path>` can continue, adjust, read, or review it.
