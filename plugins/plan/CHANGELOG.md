# Changelog

## Unreleased

### Changed

- Renamed the package to `@mgood-pi/plan` and the command to `/mgood-pi:plan`.
- Replaced the Plan Workflow with a focused planning mode that restates the request, actively clarifies material ambiguity, confirms the brief, investigates repository evidence, and creates one Markdown file under `tmp/plans/`.
- Removed the core discovery dependency, Schema v5, `PLAN.md`/`REVIEW.md` pairs, menus, execution, review, updates, status tracking, and deletion.

## 1.0.0

### Major Changes

- cc2b823: Replace the former Plan Workflow with `@mgood-pi/plan` and `/mgood-pi:plan`. The focused mode restates and clarifies the request, confirms the brief, investigates repository evidence, and creates exactly one schema-free Markdown plan under `tmp/plans/`. Remove plan discovery, execution, review, status, paired files, menus, and the shared plan-workflow core.

## 0.2.0 — 2026-09-21

### Added

- Initial local planning workflow under the former `@mgood-pi/plugin-plan-workflow` package name.
