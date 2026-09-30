# @mgood-pi/plugin-plan-workflow

Interactive bilingual local Plan Workflow for Pi.

## Command

```text
/mgood:plan [new-request-or-local-plan-directory]
```

It is the only public Plan Workflow command. In the TUI it can create a local Plan, select one, read it, continue implementation, make an in-place adjustment, run acceptance review, or explicitly discard the selected local files.

All state is local to the current repository:

```text
tmp/work-plans/<feature-slug>/
├── PLAN.md
└── REVIEW.md
```

The plugin does not modify `.gitignore`; users decide whether `tmp/` is ignored. It does not read the legacy repository-root `work-plans/` layout.

`PLAN.md` is a living plan with checklist progress and an adjustment log. `REVIEW.md` is an append-only acceptance record. A review needing changes returns items to the same Plan instead of creating another authorization/remediation workflow.

## Install

```bash
pi install npm:@mgood-pi/plugin-plan-workflow
```

For local development:

```bash
pi install -l ./plugins/plan-workflow
pi -e ./plugins/plan-workflow
```

The command requires an idle interactive TUI and fails closed in print/json/rpc modes. Internal planner, executor, and reviewer guidance is injected as a hidden custom session message: it remains in LLM context and starts the agent turn but is not displayed as user input. The plugin never switches models; use Pi's `/model` explicitly.

It never modifies `.gitignore`, stages, commits, pushes, resets, cleans, stashes, checks out, or rewrites Git history. Formal repository documentation is created only when the user explicitly asks the agent to derive it from local Plan/Review state.

See the [Local Plan Workflow documentation](../../docs/features/plan-workflow/README.md).
