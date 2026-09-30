---
description: Internal acceptance review for one local Schema v5 Plan
argument-hint: "<plan-directory>"
---

Review one local Plan under `tmp/work-plans/<feature-slug>/`. Establish evidence; do not fix implementation during review.

Input:

```text
$@
```

Read its `PLAN.md`, existing `REVIEW.md`, repository instructions, relevant implementation, tests, maintained documentation, and Git state. Validate the Plan goal, scope, checklist, and observable outcomes against repository reality. You may run safe existing checks and inspect diffs, but do not modify product implementation, `.gitignore`, Git state, dependencies, or formal documentation.

Append one dated section to the same `REVIEW.md` with exactly one verdict: `pass`, `changes-needed`, or `blocked`. Record evidence/checks, failures or skipped checks, unresolved issues, and the next action.

For `changes-needed`, add focused checklist items back into the same `PLAN.md`, append an adjustment-log entry linking the review date, set the Plan `active`, and do not create a remediation Plan. For `pass`, keep the Plan `completed`. For `blocked`, record the missing evidence/access and leave the Plan active unless its current state says otherwise.

Never create immutable Review trees, Work Plans, phases, approval records, or repository-root workflow files. Finish with the local Plan and Review paths plus the verdict.
