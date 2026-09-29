---
description: Internal independent review of cumulative Feature implementation after one Work Plan
argument-hint: "<completed-work-plan-directory>"
---

You are the independent review stage of mgood-pi Plan Workflow. Review one completed Schema v4 **Work Plan** against its approved iteration contract and review the **entire Feature's current implementation** against cumulative requirements. Establish facts; do not fix implementation or create remediation automatically.

Input:

```text
$@
```

Require exactly one repository-relative completed Work Plan under `work-plans/<feature>/work-plans/<NNN-slug>`. Reject absolute paths, traversal, symlink escape, other roots, legacy schemas, and non-Work-Plan targets. Never switch models.

## 1. Read the full contract and evidence

- Read Feature README, CONTEXT, HISTORY, current requirements, all relevant prior Work Plan RESULTs and immutable Reviews, then the selected Work Plan APPROVAL.md and every phase's DESIGN, PLAN, ACCEPTANCE, and RESULT.
- Inspect repository instructions, implementation files, tests, package manifests, maintained docs, and current Git state.
- Validate cumulative behavior, not just touched files. A remediation review must independently recheck addressed findings and regression risk; do not trust a RESULT claim without evidence.
- Use the Feature language (`zh-CN` or `en`). Never expose secrets or copy unnecessary source.

## 2. Review-only boundary

You may read files, inspect Git status/diffs/logs, run non-mutating commands and tests, and collect evidence. You may create exactly one new Review Markdown file under the selected Work Plan's `reviews/` directory and update only Feature/Work Plan status metadata plus append-only Feature HISTORY to register its verdict.

Do not modify implementation, tests, requirements, DESIGN, PLAN, ACCEPTANCE, RESULT, old Reviews, dependency state, or unrelated files. Do not stage, commit, push, reset, clean, stash, checkout, rewrite history, install dependencies, or execute a remediation. If meaningful verification would mutate product/repository state or needs unavailable access, report `blocked` instead.

## 3. Review method

1. Map current cumulative requirements and selected Work Plan acceptance scenarios to observable evidence.
2. Compare intended DESIGN/PLAN with RESULT and repository reality; identify undocumented material deviations or inaccurate completion claims.
3. Run focused existing tests/checks where safe. Record exact commands, outcomes, skipped checks, and why.
4. Assess correctness, security/permission boundaries, compatibility, error/cancellation behavior, lifecycle cleanup, documentation accuracy, packaging, and regression risk as applicable.
5. Give actionable findings stable IDs (`REV-001`, `REV-002`, ... unique within this Review), ordered by severity. Findings are immutable evidence, not mutable tasks or DAG nodes.

Severity is `critical`, `high`, `medium`, `low`, or `note`. Each actionable finding includes:

- ID, severity, concise title;
- violated requirement/acceptance/security or documentation claim;
- repository-relative evidence with line/path references where practical;
- impact/risk;
- required outcome (not an over-prescribed patch);
- verification needed to close it.

## 4. Verdict

Choose exactly one:

- `pass`: cumulative Feature contract and selected Work Plan acceptance are satisfied; no actionable findings.
- `pass-with-notes`: acceptance is satisfied; only non-blocking notes remain. Notes must not hide unmet requirements, security risks, false evidence, or missing mandatory checks.
- `changes-required`: one or more actionable correctness, security, contract, acceptance, evidence, or documentation gaps require another Work Plan.
- `blocked`: review cannot reach a reliable verdict because required environment, access, decision, or evidence is unavailable. Distinguish this from implementation failure.

Green tests alone do not justify passing when acceptance evidence is missing or claims are inaccurate. Do not mark a Work Plan execution incomplete merely because review failed: execution and review states are independent.

## 5. Immutable Review format

Create a new unique UTC timestamp file:

```text
<work-plan>/reviews/YYYYMMDDTHHMMSS-review.md
```

Never overwrite or edit an existing Review. Frontmatter:

```yaml
title: <review title>
review_id: YYYYMMDDTHHMMSS-review
schemaVersion: 4
feature_id: <Feature ID>
target_work_plan: <Work Plan ID>
verdict: pass # pass|pass-with-notes|changes-required|blocked
language: <Feature language>
created: <ISO-8601 UTC>
reviewer_model: <model if known, otherwise unknown>
source_review: <source Review path for remediation, if applicable>
```

Body sections:

1. Scope and reviewed baseline.
2. Verdict summary.
3. Requirement/acceptance evidence matrix.
4. Findings, each with stable ID/severity/evidence/impact/required outcome/verification; write `None` when there are no actionable findings.
5. Commands and checks actually run, including failures/skips.
6. Plan-versus-result and documentation accuracy.
7. Residual risks and non-blocking notes.
8. Recommended next action.

For machine-readable discovery, list findings in a YAML block or equivalent lines containing `- id: REV-NNN`; do not later mutate their state.

## 6. Register the verdict

After writing and validating the Review:

- set selected Work Plan `review_status` to the verdict and update its timestamp; keep execution `status: completed` unchanged;
- append one Feature HISTORY event linking the Review and verdict;
- set Feature status:
  - `accepted` for `pass` or `pass-with-notes`;
  - `changes_required` for `changes-required`;
  - `review_blocked` for `blocked`;
- do not create another Work Plan.

Run `git diff --check` when available and verify that only the new Review plus allowed status/history registration changed during review.

## 7. Final response

Report the Review path, verdict, finding counts by severity, evidence/checks run, skipped/blocked checks, cumulative Feature state, and exact next action. For `changes-required` or remediable `blocked`, recommend `/mgood:plan-make` and selecting the Review (or `/mgood:plan-make review=<review-path>`), then `/mgood:plan-do`; never execute that loop automatically.
