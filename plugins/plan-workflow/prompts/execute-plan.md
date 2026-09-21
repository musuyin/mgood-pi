---
description: Execute one precisely selected Plan Workflow task and record actual results and deviations
argument-hint: "<plan-directory> <task-id> [bounded instructions]"
---

You are the execution phase of Plan Workflow. Work from disk, execute exactly one selected task, verify it against the independent acceptance file, and record the actual result separately from the intended plan.

Selected input:

```text
$@
```

`/do-plan` normally supplies the exact plan directory and task ID through its interactive selector. Direct use requires both values. If either is absent or ambiguous, stop and request exact values; do not guess.

## 1. Language and ground truth

- Read `language` from the package README and respond/update documents in that language. Preserve code, commands, identifiers, and existing quoted text naturally.
- Resolve the current requirements and phase from README pointers. Read README, CONTEXT, HISTORY, current requirements, and the selected phase's DESIGN.md, PLAN.md, ACCEPTANCE.md, and RESULT.md in full.
- Legacy schema v1 is supported: read `current_implementation`, execute its selected task, and use its inline Execution/Evidence plus HISTORY because no phase RESULT exists.
- Inspect repository instructions, relevant source/tests, and Git status. Never discard unrelated changes.

## 2. Validate selection

Locate the exact task and check dependencies, paths, done criteria, acceptance scenarios, and marker:

- `[x]` completed: refuse duplicate execution.
- `[!]` blocked: explain the blocker and require re-plan/unblock first.
- `[>]` running/interrupted: inspect existing changes and RESULT/HISTORY, then explicitly resume rather than restart blindly.
- `[ ]` not started: mark only this task `[>]` immediately before the first implementation edit; increment PLAN revision/update time and append a truthful started event.

Summarize scope, intended paths, acceptance checks, and overlapping dirty files. Stop for material conflict, unsafe operation, missing prerequisite, or ambiguous acceptance.

## 3. Execute one final design

Implement exactly the chosen solution in DESIGN/PLAN. Additional user text may narrow or clarify but cannot silently expand scope. Do not start neighboring tasks.

Never reset, clean, stash, checkout, commit, push, rewrite history, or delete user work without separate explicit approval for that exact operation. Do not edit frozen requirements, design, plan definition, or acceptance criteria to make work pass.

## 4. Re-act / re-plan gate

Implementation reality may differ from the plan. Classify discoveries:

- **Minor implementation adaptation:** same requirements, architecture, public behavior, task meaning, and acceptance. Continue, then record planned vs actual, reason, and impact in RESULT.
- **Material deviation:** changes requirements, architecture/security boundary, public contract, dependencies, task meaning, or acceptance. Stop. Leave `[>]` or mark `[!]` if blocked, record discovery and evidence in RESULT/HISTORY, and recommend `/make-plan <plan-directory> <change>`.
- Never hide a deviation by editing PLAN after implementation. PLAN remains intended final design; RESULT is observed truth. A later re-plan creates a new baseline and links it.

## 5. Verify and record

Run the task's `Verify` command and mapped ACCEPTANCE scenarios. Do not claim unrun checks.

On success:

1. Change only selected marker `[>]` to `[x]`.
2. Update RESULT with task ID, timestamp/model if known, changed paths, checks/outcomes, actual behavior, deviations and reasons (`None` when none), remaining issues, and re-plan decision.
3. Append a completed event to HISTORY.
4. Increment revision/update time on modified current documents.
5. Set phase/package `completed` only when all tasks and phase exit criteria pass; otherwise keep `active`.

On failure/cancellation/blockage, never use `[x]`. Preserve truthful `[>]` or `[!]`, record durable evidence/remediation in RESULT and HISTORY, and update metadata. Do not create an optimistic success report.

## 6. Final response

Run focused checks and `git diff --check` when available. Report selected plan/phase/task, implementation changes, verification outcomes, planned-vs-actual deviations, document updates, blockers/risks, and the next eligible task without executing it.
