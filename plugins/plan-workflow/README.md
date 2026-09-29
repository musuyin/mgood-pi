# @mgood-pi/plugin-plan-workflow

Interactive bilingual Schema v4 Plan Workflow for Pi.

## Commands

- `/mgood:plan-make` — create a Feature, add a Work Plan, or create remediation from an immutable Review.
- `/mgood:plan-approve [work-plan-directory]` — display and explicitly approve one draft Plan in TUI.
- `/mgood:plan-do [work-plan-directory]` — select and execute/resume one Work Plan across ordered phases.
- `/mgood:plan-review [work-plan-directory]` — independently review completed implementation and write a new immutable Review.
- `/mgood:plan-list [feature-or-plan-directory]` — list workflow state or read a Plan's canonical `APPROVAL.md` without a model turn.

All workflow data is stored under the fixed repository root `work-plans/`. Selectors provide discovered choices plus manual-path escape hatches; direct paths must remain inside that root and parse as the expected Schema v4 type. Legacy schemas and custom roots are unsupported.

The plugin never switches models. Use Pi's `/model` before each stage if desired.

## Install

```bash
pi install npm:@mgood-pi/plugin-plan-workflow
```

Local development:

```bash
pi install -l ./plugins/plan-workflow
pi -e ./plugins/plan-workflow
```

The four mutating commands require TUI and fail closed in print/json/rpc modes. `/mgood:plan-list` is read-only: TUI selectors can open complete Plan details and every mode can print them when passed a Plan directory. `/mgood:plan-approve` performs the only `draft` → `approved` transition; when a draft declares an eligible same-Feature `supersedes` Plan, approval also records that old Plan as `superseded` and moves the Feature current-Plan pointer. The extension reads bundled internal Markdown guidance directly and injects it as a hidden custom session message that still participates in LLM context and triggers the agent turn; it does not register prompt commands or display the internal prompt in the TUI. Users therefore have only the five public `/mgood:plan-*` interfaces. Model-driven actions are not an OS sandbox. Review does not modify implementation or automatically execute remediation.

See [Plan Workflow documentation](../../docs/features/plan-workflow/README.md) and the repository [release guide](../../docs/releasing.md).
