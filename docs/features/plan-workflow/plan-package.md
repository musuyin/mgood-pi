# Plan package contract

Schema v2 separates durable feature knowledge, per-phase design, executable intent, acceptance, and observed implementation.

## Layout

```text
<plan-root>/
└── YYYY-MM-DD-stable-slug/
    ├── README.md
    ├── CONTEXT.md
    ├── HISTORY.md
    ├── requirements/
    │   ├── v1.md
    │   └── v2.md
    └── phases/
        ├── phase-1-foundation/
        │   ├── DESIGN.md
        │   ├── PLAN.md
        │   ├── ACCEPTANCE.md
        │   └── RESULT.md
        └── phase-2-integration/
            └── ...
```

The root date, slug, and `plan_id` remain stable. Phase directories are ordered, bounded delivery slices rather than arbitrary categories.

## Shared metadata

Every file contains:

```yaml
plan_id: 2026-09-21-example
schemaVersion: 2
version: 1
revision: 1
status: draft
language: zh-CN # or en
created: 2026-09-21T10:30:00Z
updated: 2026-09-21T10:30:00Z
```

Allowed package/phase states: `draft`, `approved`, `active`, `completed`, `superseded`, `abandoned`.

`README.md` additionally stores `current_requirements`, `current_phase`, and ordered phase pointers. These pointers, not lexicographic filename order, identify the active baseline.

## Root documents

### `README.md`

Stable index with summary, pointers, document map, phase progress, interactive `/do-plan` instructions, and unresolved decisions.

### `CONTEXT.md`

The maintained feature wiki: problem, repository facts with path citations, users, workflows, architecture, scope, constraints, terminology, and final cross-phase decisions.

### `requirements/vN.md`

Observable `R1`, `R2`, ... behavior baseline with acceptance criteria, edge cases, non-functional requirements, exclusions, and `supersedes` linkage.

### `HISTORY.md`

Append-only events for planning decisions, task start/completion/failure, observed deviations, re-plan, supersession, and abandonment. It never stores secrets or large diffs.

## Phase documents

### `DESIGN.md`

Contains phase goal, evidence, constraints, selected design, interfaces/data flow, user decisions, and alternatives with rejection reasons. This is where design experience is retained.

### `PLAN.md`

Contains only the final selected implementation. Alternatives, unresolved branches, and speculative “maybe” paths are forbidden.

Tasks use stable IDs and four markers:

```markdown
- [ ] **AUTH-101: Not-started task**
- [>] **AUTH-102: Running or interrupted task**
- [!] **AUTH-103: Blocked task**
- [x] **AUTH-104: Completed task**
```

Each full task includes requirements, dependencies, paths, bounded work, done criteria, and exact verification. IDs are globally unique and dependencies acyclic.

### `ACCEPTANCE.md`

Independent acceptance contract. It maps requirements/tasks to scenarios with preconditions, action, expected result, exact verification, phase exit criteria, and known non-blocking limitations. Execution cannot weaken it simply because implementation is difficult.

### `RESULT.md`

Observed truth, initially “not implemented”. Execution appends/updates:

- task and changed paths;
- commands and verification outcomes;
- actual behavior;
- differences from DESIGN/PLAN;
- why the planned route was infeasible;
- impact and re-plan decision;
- remaining issues.

PLAN says what should happen; RESULT says what did happen.

## Re-act and re-plan

- Minor adaptation that preserves requirements, architecture, behavior, task meaning, and acceptance is completed and explained in RESULT.
- Material deviation stops execution, leaves the task running/blocked, records evidence, and invokes `/make-plan <existing-directory> <change>`.
- Requirements/design/plan/acceptance freeze once execution starts. Semantic changes create a new baseline rather than editing history.
- Replacement tasks are classified `carried_forward`, `revalidate`, `replaced`, or `dropped` with evidence/reason.

## Legacy schema v1

The selector continues to read plans whose README points to `current_implementation`. Such plans appear as one `legacy` phase and execute with inline `Execution`/`Evidence` plus HISTORY.

Schema v1 is not automatically rewritten. Revise an old plan with `/make-plan <plan-directory> <change>` when phase separation is useful; preserve its old implementation files and history.
