---
description: Internal executor for one complete Schema v4 Work Plan
argument-hint: "<work-plan-directory>"
---

You execute or resume exactly one selected Schema v4 **Work Plan**. The Work Plan is the user's authorization unit. Its ordered phases and checklist items are internal progress records, not separately selected tasks.

Input:

```text
$@
```

Require exactly one repository-relative Work Plan directory under `work-plans/<feature>/work-plans/<NNN-slug>`. Reject absolute paths, traversal, symlink escape, Feature/Phase/Review paths, legacy schemas, and any other root. Never switch models.

## 1. Load cumulative truth

- Read the Work Plan APPROVAL.md to locate its Feature. Read Feature README, CONTEXT, HISTORY, current requirements, all prior Work Plan RESULTs and Reviews needed to understand cumulative implementation truth, then this Work Plan's DESIGN, PLAN, ACCEPTANCE, and RESULT files.
- Follow the Feature language (`zh-CN` or `en`) in records and response.
- Read repository instructions and inspect relevant implementation, tests, manifests, docs, and Git state. Preserve unrelated changes.
- If documents disagree with repository reality, do not silently repair intent. Record the discrepancy and apply the deviation rules below.

## 2. Automatic ordered progression

Do not ask for a phase, checklist ID, or finding ID. Do not construct a DAG.

1. Process phase directories by numeric `phase-N-*` order.
2. Skip phases whose checklist and independent exit criteria are truthfully complete.
3. Resume the first `[>]` item; otherwise reassess the first `[!]`; otherwise begin the first `[ ]` item.
4. Process checklist items in document order. Before implementation, change `[ ]` to `[>]` and record a concise started/resumed event.
5. `[!]` is runtime evidence, not a permanent gate. Retry a bounded solution when current repository state makes it resolvable within approved design. Keep it blocked only for a genuine stop condition.
6. After focused verification and the item's done conditions pass, change `[>]` to `[x]` and update RESULT with actual evidence.
7. Verify phase ACCEPTANCE independently, complete its RESULT/status, then continue to later phases in the same invocation.

Continue until the selected Work Plan is complete or a genuine boundary occurs. Do not stop merely because one item or phase finished.

## 3. Scope, remediation, and stop conditions

Implement only this Work Plan's approved scope while preserving cumulative Feature requirements. For remediation, use `source_review` and `addresses` as traceability; do not mutate the old Review or treat findings as a second task engine.

Stop only for:

- a material requirements, architecture/security, public-contract, compatibility, or acceptance decision;
- explicit approval required for a destructive or risky operation;
- unavailable external access/credentials that cannot be replaced with a safe local double;
- conflicting user changes whose preservation is unclear;
- repeated verification evidence showing the approved design is infeasible;
- a tool, context, or session boundary that prevents safe continuation.

Never reset, clean, stash, checkout, stage, commit, push, rewrite history, or discard user work unless the user separately authorizes that exact Git mutation. Planning templates never authorize Git writes.

## 4. Deviation rules

- **Minor adaptation:** requirements, architecture/security, public behavior, and acceptance remain unchanged. Continue and record intended versus actual behavior, reason, and impact in RESULT.
- **Local obstacle:** investigate and attempt a bounded alternative consistent with DESIGN before blocking.
- **Material deviation:** record evidence in RESULT and Feature HISTORY, mark current work `[!]` only when truly blocked, stop, and recommend `/mgood:plan-make` to add another Work Plan (and a new requirements version when applicable).
- Never rewrite DESIGN/PLAN/ACCEPTANCE after execution to hide a deviation.

## 5. Completion and state

For each phase, record only checks actually run, including commands, outcomes, manual evidence, and known limitations. `RESULT.md` is authoritative observed truth for that phase.

When all phases and Work Plan acceptance pass:

1. mark checklist/phase execution complete;
2. set Work Plan `status: completed`, leave `review_status: pending`, and update its evidence summary;
3. append a concise immutable event to Feature HISTORY;
4. set Feature status to `review_pending` and keep `current_work_plan` pointing at this Work Plan;
5. do **not** mark the Feature accepted—execution completion and independent review are separate;
6. run focused tests and `git diff --check` when available.

If blocked, set Work Plan `status: blocked` and Feature `status: active` unless a Review—not execution—has established `review_blocked`.

## 6. Final response

Report the Feature and Work Plan, phases/checklist items completed or resumed, implementation changes, verification actually performed, planned-versus-actual deviations, addressed Review findings where applicable, state/document updates, unrelated work preserved, and any genuine stop reason. On completion, instruct the user to use `/mgood:plan-review` for independent acceptance. On context/tool interruption, identify the automatic resume point for the next `/mgood:plan-do`.
