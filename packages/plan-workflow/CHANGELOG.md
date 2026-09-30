# Changelog

## Unreleased

### Changed

- Replaced Schema v4 Feature/Work Plan discovery with breaking Schema v5 local `tmp/work-plans/<feature>/{PLAN.md,REVIEW.md}` discovery.
- Removed runtime support for repository-root workflow trees, phases, approvals, immutable reviews, and supersession lineage.

### Changed

- Replaced legacy Schema v1/v2 parsing with the then-breaking Schema v3 Feature → Work Plan → Phase → Review model.
- Restricted discovery and explicit loading to the canonical `work-plans` root with symlink-escape protection.
- Added separate Work Plan execution/review state, immutable Review discovery, and Feature-grouped summaries.

## 1.0.0

### Major Changes

- [`d3469ef`](https://github.com/musuyin/mgood-pi/commit/d3469ef3639ddd698af878e77dab987322fc8a23) Thanks [@musuyin](https://github.com/musuyin)! - Replace the repository-managed workflow with breaking Schema v5 local Plan Workflow. Expose only TUI-only `/mgood:plan`; store mutable local state solely in `tmp/work-plans/<feature>/{PLAN.md,REVIEW.md}`. Remove Work Plans, phases, approvals, supersession, immutable remediation reviews, and all runtime scanning of repository-root `work-plans/`. Internal guidance remains hidden custom session context rather than public prompt commands.

### Patch Changes

- [`6a6f58c`](https://github.com/musuyin/mgood-pi/commit/6a6f58c0854cb054a2453b76814c7fd3575053b8) Thanks [@musuyin](https://github.com/musuyin)! - Prepare independently installable Pi packages for public npm publication, including the Plan Workflow plugin and its shared implementation dependency. Add the curated, explicitly confirmed `/mgood:market` installer to the market plugin.

## 0.2.0 — 2026-09-21

### Changed

- Converted the package into framework-neutral plan discovery and parsing.
- Added phase-based schema v2 and legacy schema v1 support.
- Added completed, running, blocked, and not-started task states.

## 0.1.0 — 2026-09-18

### Added

- Initial prompt-only Plan Workflow prototype. Prompt assets moved to the plugin package in 0.2.0.
