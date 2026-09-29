# @mgood-pi/plan-workflow-core

Framework-neutral, read-only discovery and parsing for Plan Workflow Schema v4.

It provides:

- the fixed root contract `work-plans`;
- Feature, Work Plan, ordered Phase/checklist, and immutable Review discovery;
- execution/review status aggregation;
- explicit object loading with canonical `realpath` containment and symlink-escape rejection.

It intentionally does not discover legacy schema v1/v2, `docs/plans`, `tmp/plans`, configurable roots, or arbitrary directories named `work-plans`.

End users should install [`@mgood-pi/plugin-plan-workflow`](../../plugins/plan-workflow/README.md), which bundles this package and provides `/mgood:plan-make`, `/mgood:plan-list`, `/mgood:plan-approve`, `/mgood:plan-do`, and `/mgood:plan-review`. This implementation package is independently versioned/published only so the plugin can consume it as a normal npm dependency.
