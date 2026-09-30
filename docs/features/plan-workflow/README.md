# Local Plan Workflow

Local Plan Workflow is a lightweight bilingual Pi workflow for keeping one active plan and one acceptance record per temporary feature.

```text
Local Feature → PLAN.md → implementation adjustments → REVIEW.md
```

It is local workbench state, not a repository documentation, release, or audit system.

## One command

```text
/mgood:plan <new request>
/mgood:plan
/mgood:plan tmp/work-plans/<feature>
```

- With a new request, the plugin creates a local plan through the active model.
- With no argument, it lets the user select a discovered local plan, or enter a new request.
- With a local plan directory, it opens a TUI menu: read, continue implementation, update, run acceptance review, or discard local state.

The plugin never changes Pi models; use Pi's `/model` explicitly.

## Local layout

Only this root is discovered:

```text
tmp/work-plans/<feature-slug>/
├── PLAN.md
└── REVIEW.md
```

`tmp/work-plans/` is deliberately local. The plugin does not modify `.gitignore`; users decide whether to ignore `tmp/` or selectively retain local plans. It never discovers or changes the old repository-root `work-plans/` layout.

`PLAN.md` is a living, practical record of the goal, scope, non-goals, ordered checklist, decisions, blockers, and adjustment log. Small corrections are made in place. A new plan is only appropriate for a genuinely different feature.

`REVIEW.md` is an append-only acceptance record. A `changes-needed` review returns focused work to the same `PLAN.md`; it does not create remediation plans.

## Safety and persistence

The core validates manually supplied directories beneath the fixed root after canonical `realpath` resolution and rejects traversal and symlink escapes. The plugin never modifies Git, `.gitignore`, dependencies, or formal project documentation.

Planning, implementation, and review guidance is injected as hidden custom session messages. It participates in LLM context and starts the agent turn, but the internal prompt is not displayed as user input in the TUI.

When a local plan reaches stable conclusions, users may explicitly ask the agent to derive or update committed documentation such as a README, feature guide, ADR, or changelog. The workflow never does that automatically.

See [operations](./operations.md) and the [local package contract](./plan-package.md).
