# Changelog

## Unreleased

### Changed

- Replaced Schema v4 Feature/Work Plan discovery with breaking Schema v5 local `tmp/work-plans/<feature>/{PLAN.md,REVIEW.md}` discovery.
- Removed runtime support for repository-root workflow trees, phases, approvals, immutable reviews, and supersession lineage.

### Changed

- Replaced legacy Schema v1/v2 parsing with the then-breaking Schema v3 Feature → Work Plan → Phase → Review model.
- Restricted discovery and explicit loading to the canonical `work-plans` root with symlink-escape protection.
- Added separate Work Plan execution/review state, immutable Review discovery, and Feature-grouped summaries.

## 0.2.0 — 2026-09-21

### Changed

- Converted the package into framework-neutral plan discovery and parsing.
- Added phase-based schema v2 and legacy schema v1 support.
- Added completed, running, blocked, and not-started task states.

## 0.1.0 — 2026-09-18

### Added

- Initial prompt-only Plan Workflow prototype. Prompt assets moved to the plugin package in 0.2.0.
