# Changelog

## Unreleased

### Changed

- Replaced the repository-managed Schema v4 hierarchy with the breaking Schema v5 local workflow: one TUI-only `/mgood:plan` command and `tmp/work-plans/<feature>/{PLAN.md,REVIEW.md}`.
- Removed public make/list/approve/do/review commands, Work Plan approval/supersession state, phases, and immutable remediation reviews from the current runtime.
- Internal planner, executor, and reviewer guidance now operates on the same mutable local Plan and append-only local Review.

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

## 1.0.0

### Major Changes

- [`d3469ef`](https://github.com/musuyin/mgood-pi/commit/d3469ef3639ddd698af878e77dab987322fc8a23) Thanks [@musuyin](https://github.com/musuyin)! - Replace the repository-managed workflow with breaking Schema v5 local Plan Workflow. Expose only TUI-only `/mgood:plan`; store mutable local state solely in `tmp/work-plans/<feature>/{PLAN.md,REVIEW.md}`. Remove Work Plans, phases, approvals, supersession, immutable remediation reviews, and all runtime scanning of repository-root `work-plans/`. Internal guidance remains hidden custom session context rather than public prompt commands.

### Patch Changes

- [`6a6f58c`](https://github.com/musuyin/mgood-pi/commit/6a6f58c0854cb054a2453b76814c7fd3575053b8) Thanks [@musuyin](https://github.com/musuyin)! - Prepare independently installable Pi packages for public npm publication, including the Plan Workflow plugin and its shared implementation dependency. Add the curated, explicitly confirmed `/mgood:market` installer to the market plugin.
- Updated dependencies [[`d3469ef`](https://github.com/musuyin/mgood-pi/commit/d3469ef3639ddd698af878e77dab987322fc8a23), [`6a6f58c`](https://github.com/musuyin/mgood-pi/commit/6a6f58c0854cb054a2453b76814c7fd3575053b8)]:
  - @mgood-pi/plan-workflow-core@1.0.0

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
