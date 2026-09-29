# Schema v4 plan package contract

## Hierarchy and layout

```text
work-plans/<feature-slug>/
├── README.md                       # Feature identity, pointers, aggregate state
├── CONTEXT.md                      # maintained cumulative product/repository truth
├── HISTORY.md                      # append-only lifecycle events
├── requirements/vN.md              # cumulative observable baseline
└── work-plans/
    └── NNN-<iteration-slug>/
        ├── APPROVAL.md             # canonical execution/review authorization and approval audit
        ├── phases/
        │   └── phase-N-<slug>/
        │       ├── DESIGN.md
        │       ├── PLAN.md
        │       ├── ACCEPTANCE.md
        │       └── RESULT.md
        └── reviews/
            └── YYYYMMDDTHHMMSS-review.md
```

No other plan root is supported. A Feature slug is stable. Work Plan sequences are monotonically increasing three-digit prefixes. Reviews are immutable files owned by the Work Plan they assess.

## Authority and states

### Feature

Feature `README.md` is authoritative for `feature_id`, current requirements/Work Plan pointers, language, and aggregate status:

- `planning`
- `active`
- `review_pending`
- `changes_required`
- `review_blocked`
- `accepted`
- `paused`
- `abandoned`
- `superseded`

`CONTEXT.md` is maintained cumulative truth, `requirements/vN.md` is the current product/acceptance contract, and `HISTORY.md` is append-only. Prior Work Plan Results and Reviews remain evidence and are not rewritten to simulate current truth.

### Work Plan

Work Plan `APPROVAL.md` is authoritative for:

- identity: `feature_id`, `work_plan_id`, `sequence`, `kind`;
- execution `status`: `draft`, `approved`, `active`, `blocked`, `completed`, `superseded`, or `abandoned`;
- independent `review_status`: `pending`, `pass`, `pass-with-notes`, `changes-required`, or `blocked`;
- requirements pointer and optional `source_review`/`addresses` lineage;
- approval audit: `approved_at` and optional `approval_note` (no fabricated approver identity);
- optional replacement lineage: a new draft's `supersedes`, and the approved replacement's old Plan `superseded_by`, `superseded_at`, and optional `supersede_reason`.

Only `/mgood:plan-approve` may transition a valid `draft` Plan to `approved` or make a declared same-Feature supersession effective. It displays the complete `APPROVAL.md`, asks Yes/No in TUI, directly approves on Yes, and records required feedback while retaining `draft` on No. On a valid supersession it also updates the predecessor, Feature current-Plan pointer, and append-only `HISTORY.md`. Execution completion and review acceptance are separate. `/mgood:plan-do` acts only on approved/active/blocked incomplete Work Plans. `/mgood:plan-review` acts only on completed Work Plans.

### Phase and checklist

Each Phase owns `DESIGN.md`, `PLAN.md`, `ACCEPTANCE.md`, and `RESULT.md`:

- DESIGN preserves selected architecture, evidence, decisions, and rejected alternatives.
- PLAN contains only the chosen implementation and ordered checklist.
- ACCEPTANCE remains independent and cannot be weakened during execution.
- RESULT records actual changes, verification, deviations, and remaining issues.

Checklist markers are `[ ]` not started, `[>]` running/interrupted, `[!]` runtime blocked evidence, and `[x]` complete. IDs are stable and unique within the Feature. Phase order and checklist document order are sequencing; there are no task edges or `Depends on` fields.

A new executable Work Plan contains no `[!]`. During execution, `[!]` triggers current-evidence reassessment and bounded recovery rather than permanent refusal.

## Reviews and remediation

`/mgood:plan-review` reviews the selected Work Plan's contract and changes while validating cumulative Feature behavior. It writes a new UTC timestamped Review and does not modify implementation or old Reviews.

Verdicts:

- `pass`: accepted with no actionable findings;
- `pass-with-notes`: accepted with non-blocking notes only;
- `changes-required`: another Work Plan is needed;
- `blocked`: evidence/access/environment prevents reliable review.

Findings use stable IDs such as `REV-001`, severity, violated contract, evidence, impact, required outcome, and closure verification. Findings are evidence, not mutable tasks. A remediation Work Plan references the immutable `source_review` and its `addresses` IDs, then groups work into its own coherent checklist. A later Review independently verifies closure.

## Lifecycle

```text
Feature planning
  → Work Plan draft/approved
  → active execution
  → completed + review pending
  → Review pass/pass-with-notes → Feature accepted
  → Review changes-required    → remediation Work Plan → execute → Review
  → Review blocked             → Feature review_blocked until a later Review
```

Minor compatible implementation adaptations are recorded in RESULT. Material changes to requirements, architecture/security, public contracts, compatibility, or acceptance require a new Work Plan and, when necessary, a new requirements version. Never rewrite a completed plan or Review to hide history.

## Required frontmatter

Every Schema v4 object includes `schemaVersion: 4`, stable identity fields, language, status/verdict, and timestamps appropriate to its type. Work Plan `APPROVAL.md` additionally contains `approved_at` and `approval_note`, both `null` while draft. Repository-relative pointers are resolved from the owning document and must remain under `work-plans` after canonicalization.

Legacy schema v1/v2 is intentionally unsupported at runtime. This repository's historical plans were manually migrated; external users must migrate rather than relying on compatibility parsing.
