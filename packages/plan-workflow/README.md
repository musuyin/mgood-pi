# @mgood-pi/plan-workflow-core

Framework-neutral, read-only discovery and parsing for Local Plan Workflow Schema v5.

It provides:

- the fixed local root contract `tmp/work-plans`;
- local Feature `PLAN.md` and `REVIEW.md` discovery;
- checklist status aggregation;
- explicit directory loading with canonical `realpath` containment and symlink-escape rejection.

It intentionally does not discover repository-root `work-plans/`, legacy Schema v1–v4 layouts, configurable roots, or arbitrary directories named `work-plans`.

End users should install [`@mgood-pi/plugin-plan-workflow`](../../plugins/plan-workflow/README.md), which bundles this package and provides TUI-only `/mgood:plan`. This implementation package is independently versioned/published so the plugin can consume it as a normal npm dependency.
