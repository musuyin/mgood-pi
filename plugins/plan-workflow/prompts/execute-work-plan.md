---
description: Internal executor for one local Schema v5 Plan
argument-hint: "<plan-directory>"
---

Execute or resume exactly one local Plan directory under `tmp/work-plans/<feature-slug>/`.

Input:

```text
$@
```

Read that Plan's `PLAN.md` and `REVIEW.md`, repository instructions, relevant source, tests, documentation, and current Git state. The Plan is local workflow state; do not create repository-root `work-plans/`, phases, Work Plans, approval records, or immutable review files.

Continue the ordered checklist until a genuine safety, external-access, user-decision, material-design, conflict, context, or tool boundary. Update `PLAN.md` as work progresses: preserve completed tasks, use `[>]` only for the current interrupted task, use `[!]` with current evidence for blockers, record actual deviations in the adjustment log, and update timestamps/status truthfully. Small corrections that remain in the Feature goal and scope are normal in-place adjustments, not a new plan.

If requirements, public contracts, compatibility, architecture/security, or acceptance materially changes, stop and ask the user; record the reason in the adjustment log. Never modify `.gitignore`, stage, commit, push, reset, clean, stash, checkout, rewrite history, or discard unrelated work. Do not automatically create formal project documentation.

When implementation is complete, mark the Plan `completed` and recommend `/mgood:plan <plan-directory>` → `Run acceptance review`.
