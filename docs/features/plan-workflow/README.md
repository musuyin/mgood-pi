# Plan Workflow

Plan Workflow is a bilingual hybrid Pi feature: a planning prompt resolves ambiguity and writes structured phase documents, while a TypeScript extension provides a `/model`-like picker for executing one task.

## Status

Version 0.2 is implemented in two packages:

- `@mgood-pi/plan-workflow-core` discovers/parses schema v2 and legacy v1 plans.
- `@mgood-pi/plugin-plan-workflow` bundles `/make-plan`, `/execute-plan`, and the interactive `/do-plan` command.

The feature does not switch models. Users keep explicit cost/capability control through Pi's built-in `/model`.

## User workflow

```text
/model
# Choose a planning model.

/make-plan root=docs/plans Add resumable uploads
# If important decisions remain, answer one consolidated questionnaire.
# Run /make-plan again with the answers when needed.

/model
# Choose an implementation model.

/do-plan
# Select plan -> phase -> task from TUI lists.
```

No full directory name or task ID is required in interactive mode. The picker displays:

- `✓ completed / 已完成`
- `▶ running / 进行中`
- `! blocked / 已阻塞`
- `○ not started / 未开始`

Completed and blocked tasks cannot be dispatched. Running tasks can be selected for evidence-aware resume.

## Language behavior

`/make-plan` detects whether the request is primarily Chinese or English, writes `language: zh-CN` or `language: en`, and generates all plan prose in that language. `/execute-plan` reads that field and keeps results/history in the same language. Identifiers, paths, code, and commands retain their natural form.

UI labels use concise English/Chinese pairs so plans in either language remain selectable.

## Planning clarification (“grill” gate)

Before writing a plan, the planner explores the repository and builds an internal decision tree. It resolves questions from code and conventions first, then asks only load-bearing questions affecting scope, architecture, security, public contracts, compatibility, or acceptance.

Unlike grill-me's default one-question-at-a-time interview, Plan Workflow presents one consolidated questionnaire for better flow. Every question includes concrete choices, an `Other` answer, evidence/provenance, and one repository-specific recommendation. The user may answer per question or accept all recommendations.

Final files are written only after required decisions are resolved:

- alternatives and their trade-offs are retained in phase `DESIGN.md` for learning;
- phase `PLAN.md` contains only the selected implementation path;
- unresolved alternatives never leak into executable tasks.

The decision-tree and recommendation approach was informed by [`rxhuljoshi/grill-me-plugin`](https://github.com/rxhuljoshi/grill-me-plugin); this repository implements its own consolidated bilingual workflow.

## Phase documents and re-plan loop

Each phase owns four separate concerns:

- `DESIGN.md` — reasoning, final design, considered alternatives and rejection reasons;
- `PLAN.md` — selected implementation and task state only;
- `ACCEPTANCE.md` — independent observable acceptance scenarios;
- `RESULT.md` — actual implementation, verification, deviations, reasons, and remaining issues.

Execution never rewrites PLAN to hide reality. A minor adaptation is recorded in RESULT. A material change to requirements, architecture, task meaning, or acceptance stops execution and returns to `/make-plan` for a new version. See [the full schema](./plan-package.md).

## Command semantics

### `/make-plan [root=<path>] <request>`

A prompt template that explores, asks a consolidated decision questionnaire when needed, and then creates/revises schema v2. It writes planning Markdown only.

### `/do-plan [optional-plan-directory]`

An Extension command. With no argument it discovers plans beneath `docs/plans` and `tmp/plans`, then opens plan, phase, and task selectors. Supplying a plan directory skips the first selector. The selected task is handed to `/execute-plan` as a precise expanded prompt.

`/do-plan` requires interactive UI. It does not attempt unsafe pseudo-selection in print/RPC modes.

### `/execute-plan <plan-directory> <task-id>`

The underlying execution prompt. It is normally invoked by `/do-plan`, but can be called directly for non-interactive automation. It executes exactly one task, verifies acceptance, and records actual results.

## Package and permission boundary

- Core: `packages/plan-workflow/`
- Pi adapter/prompts: `plugins/plan-workflow/`
- The extension itself reads plan metadata and sends the selected execution prompt. It does not edit files, switch models, start timers, or launch processes.
- The active model may use available Pi tools according to the planning/execution prompt. Prompt policy is not an OS sandbox; users must review tool calls and plans.

## Related pages

- [Schema v2 and legacy compatibility](./plan-package.md)
- [Installation, migration, recovery, and limitations](./operations.md)
- [Historical automatic multi-model proposal](../../plans/2026-09-18-plan-execute-system/README.md)
