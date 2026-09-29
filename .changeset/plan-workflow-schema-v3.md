---
"@mgood-pi/plan-workflow-core": major
"@mgood-pi/plugin-plan-workflow": major
---

Adopt the breaking Schema v4 Feature, Work Plan Approval, Phase, and immutable Review workflow under the fixed `work-plans` root. Expose `/mgood:plan-make`, `/mgood:plan-list`, `/mgood:plan-approve`, `/mgood:plan-do`, and `/mgood:plan-review`; internal planning/execution/review guidance is not registered as prompt commands. Add remediation planning, safe manual/direct selectors, separate execution and review states, explicit approval audit fields, and approved-draft supersession of eligible same-Feature Plans with preserved history.
