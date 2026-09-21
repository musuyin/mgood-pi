# Changelog

## 0.2.0 — 2026-09-21

### Added

- Interactive `/do-plan` plan, phase, and task selector with bilingual status labels.
- `/make-plan` bilingual generation and consolidated ambiguity questionnaire.
- `/execute-plan` one-task execution with separate actual-result and deviation recording.
- Phase schema v2: `DESIGN.md`, `PLAN.md`, `ACCEPTANCE.md`, and `RESULT.md`.
- Legacy schema v1 discovery compatibility.

### Changed

- `/do-plan` is now an Extension command instead of a prompt template.
- Planning retains considered alternatives in DESIGN while executable PLAN contains only the final choice.
