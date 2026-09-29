# Plan Workflow

Plan Workflow is a bilingual Pi-native loop for durable planning, execution, and independent implementation review:

```text
Feature → Work Plan → Execute → Review
           ↑                    |
           └── remediation ─────┘
```

A **Feature** owns the long-lived product goal, cumulative requirements, context, and history. A **Work Plan** is one authorized and independently reviewable iteration. Ordered **Phases** and checklist items are internal execution/resume structure.

## Packages and commands

- `@mgood-pi/plan-workflow-core` safely discovers and parses Schema v4 Features, Work Plans, Phases, and Reviews.
- `@mgood-pi/plugin-plan-workflow` registers exactly five user commands:
  - `/mgood:plan-make` — create a Feature, add a Work Plan, or plan remediation from a Review;
  - `/mgood:plan-list [feature-or-plan-directory]` — read-only discovery/status browsing and Plan reading without a model turn;
  - `/mgood:plan-approve [work-plan-directory]` — display a draft Plan and explicitly approve it in TUI;
  - `/mgood:plan-do` — select and execute/resume one approved Work Plan;
  - `/mgood:plan-review` — independently review one completed Work Plan and cumulative Feature behavior;

Bundled `create-work-plan`, `execute-work-plan`, and `review-implementation` Markdown remains internal implementation guidance. The Extension reads it, injects it as a hidden custom session message that participates in LLM context and triggers the agent turn, and does not register it as a Pi prompt command or display it as user input. The workflow never changes models. Users remain in control through Pi's `/model`.

## Fixed storage root

All shared workflow state lives under exactly:

```text
work-plans/
```

The extension does not scan arbitrary `work-plans` directories and does not support custom roots. This makes discovery, review, linking, and repository ownership deterministic. Selector manual-path escapes and direct command paths must still identify valid Schema v4 objects inside this root and pass canonical-path/symlink containment checks.

The unbranded repository-root directory is intended to be easy to upload, share, and commit. It remains distinct from ignored `.mgood-pi/`, which is reserved for future local memory/index state.

## Typical loop

```text
/model
/mgood:plan-make Add resumable uploads
# Read the generated Plan approval brief, then approve it.
/mgood:plan-list work-plans/<feature>/work-plans/001-<slug>
/mgood:plan-approve work-plans/<feature>/work-plans/001-<slug>

/model
/mgood:plan-do
# Select a Work Plan; phases/checklists advance automatically.

/model
/mgood:plan-review
# Select the completed Work Plan; a new immutable Review is written.

/mgood:plan-list
# Read current Feature, Work Plan, checklist, and Review status without a model turn.
```

If Review returns `changes-required`:

```text
/mgood:plan-make
# Choose “Create remediation from a Review”, then select the report.
/mgood:plan-do
/mgood:plan-review
```

Review never fixes code or automatically creates/executes remediation. The new Work Plan links `source_review` and `addresses` finding IDs; old Reviews remain immutable.

## Selection model

- `/mgood:plan-make` without arguments presents three actions: new Feature, existing-Feature iteration, or Review remediation.
- Ordinary `/mgood:plan-make <text>` always means a new Feature request.
- `/mgood:plan-make feature=<feature-path> <goal>` adds one iteration. In TUI, choosing an existing Feature also offers keeping eligible unfinished Plans or recording one as the new draft's replacement target.
- `/mgood:plan-make feature=<feature-path> supersede=<old-plan-path> <goal>` is the validated direct equivalent; it records intent only. The old Plan changes only when the new Plan is approved.
- `/mgood:plan-make review=<review-path>` creates remediation planning context.
- `/mgood:plan-approve [work-plan-path]`, `/mgood:plan-do [work-plan-path]`, and `/mgood:plan-review [work-plan-path]` select only Work Plans.
- `/mgood:plan-list [feature-or-plan-directory]` lists all discovered Features by default, limits to one Feature, or reads the selected Plan `APPROVAL.md`; it never selects work for execution.
- Interactive selectors end with “Enter a path manually…”; direct/manual targets have the same validation.

Users never select a Phase, checklist item, or Review finding for execution. Phase and checklist document order define sequencing; no task/finding DAG exists.

## State and truth

Work Plan execution status and review status are independent. `APPROVAL.md` is the canonical Plan entry and human approval brief. A draft may declare `supersedes`; approving it can transition one eligible same-Feature predecessor (`draft`, `approved`, or `blocked`) to `superseded`, preserve its evidence, and move the Feature current-Plan pointer. Active and completed Plans are never superseded by this workflow. A completed Work Plan normally moves the Feature to `review_pending`, not accepted. Review verdicts are:

- `pass`
- `pass-with-notes`
- `changes-required`
- `blocked`

A passing verdict makes the current Feature state `accepted`; `changes-required` normally leads to another Work Plan under the same Feature. Requirement, architecture/security, public-contract, or acceptance changes require formal replanning and potentially a new requirements version. Minor compatible implementation adaptations belong in `RESULT.md`.

See [Schema v4 package contract](./plan-package.md) and [operations](./operations.md).

## Safety boundary

The extension itself reads metadata and dispatches a validated prompt. Planning writes only workflow Markdown; execution uses the active model's normal tools within the approved Work Plan; review is read-only except for one new Review and status/history registration. Templates never authorize `.gitignore` changes or Git staging, commit, push, reset, clean, stash, checkout, history rewrite, or unrelated-work deletion. Prompt policy is not an OS sandbox.

See [ADR 0003](../../adr/0003-hybrid-plan-workflow.md) for the architecture decision.
