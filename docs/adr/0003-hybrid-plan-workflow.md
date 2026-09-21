# ADR 0003: Use a hybrid prompt and extension Plan Workflow

- **Status:** accepted
- **Date:** 2026-09-21

## Context

The prompt-only Plan Workflow can create and execute plans, but interactive use requires users to type complete plan directories and task IDs. Prompt templates cannot provide a deterministic `/model`-style selector. Planning feedback also requires bilingual output, consolidated resolution of load-bearing ambiguity, phase-specific documentation, and separation of intended design from actual implementation.

## Decision

Split the feature into:

- `packages/plan-workflow`: framework-neutral, read-only discovery/parsing of plan metadata, phases, tasks, and task state;
- `plugins/plan-workflow`: a thin Pi adapter that registers interactive `/do-plan` and bundles `/make-plan` plus internal/direct `/execute-plan` prompts.

`/do-plan` uses Pi's public `ctx.ui.select` API to choose plan, phase, and task. It displays symbolic bilingual states and dispatches the exact selected identity through `pi.sendUserMessage(..., { expandPromptTemplates: true })`. It does not select or switch models.

Adopt plan schema v2 with root wiki/requirements/history and per-phase `DESIGN.md`, `PLAN.md`, `ACCEPTANCE.md`, and `RESULT.md`. DESIGN retains considered alternatives and decisions; PLAN contains only the final implementation; ACCEPTANCE remains independent; RESULT records observed behavior and deviations. Material deviations stop execution and return to planning rather than rewriting history.

The planner uses a repository-first decision tree inspired by grill-me, but presents currently knowable decisions as one bilingual consolidated questionnaire with concrete options and recommendations. Final files are not written until load-bearing choices are resolved.

## Alternatives considered

- **Keep prompt-only `/do-plan`:** rejected because it cannot provide reliable interactive discovery/selection and creates avoidable typing friction.
- **Expose selection as a model-callable tool:** rejected for the primary workflow because selection is a direct human intent/authorization action; a slash command is clearer and does not consume an extra model tool turn.
- **Automate model switching:** deferred because users want explicit cost control through `/model`.
- **Keep one implementation file:** rejected because intended design, independent acceptance, and actual outcome evolve differently and become unclear when mixed.
- **Ask one question per turn exactly like grill-me:** rejected for this workflow's desired efficiency; questions are consolidated, with at most one dependent follow-up round.

## Consequences

- The plugin is now the installable public package; the core package is an internal bundled dependency.
- `/do-plan` requires an interactive UI. `/execute-plan` supports explicit non-interactive use.
- Existing schema v1 plans remain discoverable as a legacy single phase; migration is opt-in and preserves history.
- Prompt policy still is not an OS sandbox or atomic transaction. Deterministic selection and safe path discovery improve UX without pretending to enforce all model writes.
