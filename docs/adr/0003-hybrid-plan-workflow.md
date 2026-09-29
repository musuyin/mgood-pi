# ADR 0003: Use a hybrid Schema v4 Plan Workflow

- **Status:** accepted (supersedes this ADR's Schema v2 decision)
- **Date:** 2026-09-22

## Context

Prompt-only planning cannot provide deterministic TUI discovery and selection. The earlier Schema v2 “big Plan → phase” model also conflated a long-lived product goal with one implementation attempt, and had no independent immutable review/remediation loop. Supporting multiple roots (`docs/plans`, `tmp/plans`, custom roots) made ownership and discovery ambiguous.

The workflow needs durable cumulative product truth, independently reviewable iterations, resumable ordered implementation, explicit model control, safe path validation, and a Review → remediation cycle without turning findings into another task engine.

## Decision

Use a hybrid architecture:

- `packages/plan-workflow` is framework-neutral and read-only. It discovers/parses Schema v4 Features, Work Plans, Phases, checklist state, and Reviews; validates canonical paths; and aggregates status.
- `plugins/plan-workflow` is a thin Pi adapter. It registers `/mgood:plan-make`, read-only `/mgood:plan-list`, TUI-only `/mgood:plan-approve`, `/mgood:plan-do`, and `/mgood:plan-review`; it renders interactive selectors/manual input, validates direct arguments through core, and reads bundled internal guidance without registering it as prompt commands.

Adopt this hierarchy:

```text
Feature → Work Plan → Phase → checklist item
```

Feature owns cumulative requirements/context/history. Work Plan is one execution and review authorization unit. Phase/checklist order is the sequencing model; no task or finding DAG exists. Review targets one completed Work Plan while assessing cumulative Feature behavior, writes an immutable report, and never fixes code automatically. Remediation is a new Work Plan linked by `source_review` and `addresses` IDs.

Use exactly one unbranded repository-relative root: `work-plans/`. This makes the directory straightforward to upload or share without a product-specific wrapper. Do not scan other same-named folders and do not support configurable roots. Manual and direct paths are allowed only for valid Schema v4 objects under the canonical fixed root, including symlink-escape rejection. `.mgood-pi/` remains distinct ignored local memory/index state.

The user chooses models through Pi's `/model`; the workflow never switches them. The four mutating commands require TUI and fail closed in non-interactive modes; read-only `/mgood:plan-list` prints status and canonical Plan details in every mode. Internal `create-work-plan`, `execute-work-plan`, and `review-implementation` Markdown is read by the Extension, injected as hidden custom session messages that remain in LLM context, and is not registered as public prompt commands.

Schema v4 deliberately drops runtime compatibility with schema v1/v2. Existing repository plans are migrated manually so the runtime has one unambiguous contract.

## Alternatives considered

- **Keep Schema v2 big Plans:** rejected because each remediation attempt would either rewrite completed intent or require another unrelated top-level plan with no cumulative Feature truth.
- **Keep multiple/custom roots:** rejected because predictable ownership and safe discovery are more valuable than configurable location for this kit.
- **Recursively scan every `work-plans` directory:** rejected because unrelated repositories/content could be misclassified and selection/provenance become ambiguous.
- **Prompt-only commands:** rejected because human authorization needs deterministic discovery and TUI cancellation without another model turn.
- **Model-callable selection tool:** rejected because selection is direct human intent, not an agent decision.
- **Automatic review fixes or finding-level execution:** rejected to preserve reviewer independence and avoid a second scheduler/DAG.
- **Legacy runtime compatibility:** rejected because only this repository currently consumes the workflow and manual migration is smaller and safer.
- **Automatic model switching:** rejected because users require explicit cost/capability control.

## Consequences

- Installing the plugin provides exactly five namespaced commands and bundles the core dependency plus private internal guidance.
- Work Plan `APPROVAL.md` is the single canonical entry. `/mgood:plan-list` can read it without model invocation, and TUI-only `/mgood:plan-approve` performs the explicit `draft` → `approved` audit transition. A new draft can declare `supersedes`; approval alone makes the same-Feature replacement effective, preserving prior Plan history rather than deleting it.
- Work Plan execution completion and Review acceptance are separate states; Feature acceptance requires a passing Review.
- Repository-local planning data moves from `docs/plans` (briefly via `mgood-pi/work-plans`) to the committed, unbranded `work-plans/` root.
- Existing consumers must migrate to Schema v4; v1/v2 directories are ignored.
- The extension validates selection paths, but prompt policy remains guidance rather than an OS sandbox or atomic transaction.
- Architecture-affecting changes must keep this ADR, feature docs, package docs/manifests, changelogs, and release metadata synchronized.
