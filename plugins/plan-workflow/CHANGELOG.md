# Changelog

## Unreleased

### Changed

- Added `/mgood:plan-approve` for TUI-only explicit `draft` → `approved` approval with audit fields, Yes/No feedback handling, and Feature HISTORY events.
- Added same-Feature Plan replacement lineage: `/mgood:plan-make` records draft `supersedes` intent and approval marks an eligible old Plan `superseded`, preserving history and updating the current-Plan pointer.
- Made `/mgood:plan-list` read individual Plan `APPROVAL.md` files without a model turn.
- Adopted breaking Schema v4 with canonical Work Plan `APPROVAL.md` entries; no Work Plan README loader remains.

### Added

- Added `/mgood:plan-list` for read-only Feature and Work Plan status discovery in every Pi mode, including complete `APPROVAL.md` reading from a Plan path or TUI selector.
- Added `/mgood:plan-review` for independent cumulative implementation review and immutable Review reports.
- Added `/mgood:plan-make` modes for a new Feature, another Work Plan, and Review-derived remediation.
- Added manual-path escape hatches and validated direct arguments for Feature, Work Plan, and Review selection.

### Changed

- Replaced the Schema v2 big-Plan model with the then-breaking Schema v3 Feature → Work Plan → Phase → Review semantics.
- `/mgood:plan-do` now selects only approved/active/blocked Work Plans and executes ordered phases/checklists automatically.
- Restricted all workflow storage and selection to `work-plans`.
- Renamed public commands to the consistent namespaced `/mgood:plan-make`, `/mgood:plan-do`, `/mgood:plan-review`, and `/mgood:plan-list` API; no legacy aliases are retained.
- Replaced publicly registered prompt templates with private bundled `create-work-plan`, `execute-work-plan`, and `review-implementation` guidance read by the Extension.

## 0.2.0 — 2026-09-21

### Added

- Interactive `/mgood:plan-do` plan, phase, and task selector with bilingual status labels.
- `/mgood:plan-make` bilingual generation and consolidated ambiguity questionnaire.
- `/execute-plan` one-task execution with separate actual-result and deviation recording.
- Phase schema v2: `DESIGN.md`, `PLAN.md`, `ACCEPTANCE.md`, and `RESULT.md`.
- Legacy schema v1 discovery compatibility.

### Changed

- `/mgood:plan-do` is now an Extension command instead of a prompt template.
- Planning retains considered alternatives in DESIGN while PLAN contains only the final choice.
