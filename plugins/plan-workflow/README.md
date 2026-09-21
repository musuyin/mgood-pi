# @mgood-pi/plugin-plan-workflow

Interactive bilingual Plan Workflow for Pi.

## Commands

- `/make-plan [root=<path>] <request>` — bilingual planning prompt with a consolidated ambiguity questionnaire.
- `/do-plan [plan-directory]` — TUI plan → phase → task selector with status icons.
- `/execute-plan <plan-directory> <task-id>` — internal/direct execution prompt, useful in non-interactive mode.

The plugin never switches models. Use Pi's built-in `/model` before planning or execution.

## Install

```bash
pi install npm:@mgood-pi/plugin-plan-workflow
```

For local repository development:

```bash
pi install -l ./plugins/plan-workflow
```

For one development run:

```bash
pi -e ./plugins/plan-workflow
```

The selector discovers schema v2 phase plans and legacy v1 plans under `docs/plans` and `tmp/plans`. `/do-plan` requires an interactive UI; direct `/execute-plan` remains available for print/RPC automation.

See [`docs/features/plan-workflow`](../../docs/features/plan-workflow/README.md) for the complete contract, migration guidance, and safety limits. For independent package release instructions, see the repository [release guide](../../docs/releasing.md).
