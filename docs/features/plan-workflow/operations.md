# Installation and operations

## Install

Install only the Pi-facing plugin:

```bash
pi install npm:@mgood-pi/plugin-plan-workflow
# local development
pi install -l ./plugins/plan-workflow
```

For one development run: `pi -e ./plugins/plan-workflow`. The plugin bundles its core dependency and three private internal Markdown guidance files.

## Model and language

Use Pi's `/model` before any stage when desired. The workflow never changes models. New Features infer `zh-CN` or `en`; later Work Plans and Reviews inherit Feature language.

## Create planning state

Interactive action menu:

```text
/mgood:plan-make
```

Direct forms:

```text
/mgood:plan-make Add resumable uploads
/mgood:plan-make feature=work-plans/uploads Add retry telemetry
/mgood:plan-make review=work-plans/uploads/work-plans/001-initial/reviews/20260922T100000-review.md
```

Ordinary text always starts a new Feature. Use `feature=` for another iteration and `review=` for remediation. The planner may ask one consolidated decision questionnaire before writing files.

## List workflow state

```text
/mgood:plan-list
/mgood:plan-list work-plans/uploads
```

This read-only command lists each Feature's status plus Work Plan execution, review, and checklist totals. In the TUI, after listing all Plans or one Feature's Plans, it offers a selector to read one Plan's complete canonical `APPROVAL.md`; a validated Plan directory opens that detail directly. It accepts directories only—not `APPROVAL.md` or arbitrary file paths—and makes no model turn or write in TUI, print, JSON, and RPC modes using Pi's normal text output.

## Review and approve a draft Plan

```text
/mgood:plan-list work-plans/uploads/work-plans/001-initial
/mgood:plan-approve work-plans/uploads/work-plans/001-initial
```

When `/mgood:plan-make` adds a Plan to a Feature with an unfinished draft, approved, or blocked Plan, it can record an optional `supersedes` intent in the new draft `APPROVAL.md`. This does not change the old Plan. On approval, `/mgood:plan-approve` validates that the referenced Plan belongs to the same Feature and remains eligible, then marks it `superseded`, records the reverse link and timestamp, moves the Feature `current_work_plan` pointer, and appends the joint event to `HISTORY.md`. Active and completed Plans cannot be superseded.

`/mgood:plan-approve` is TUI-only. It accepts only a valid draft Plan directory, displays its complete `APPROVAL.md`, then asks whether to approve it. **Yes** directly changes the Approval frontmatter (`status`, `approved_at`, `approval_note: null`) and appends a UTC approval event to the owning Feature `HISTORY.md`. **No** requires approval feedback: when provided, it keeps the Plan as draft and appends the feedback to `HISTORY.md`; an empty or cancelled feedback entry makes no write. It does not call a model, Git, stage, or commit. Print, JSON, and RPC modes reject the operation without writing.

## Execute and resume

```text
/mgood:plan-do
/mgood:plan-do work-plans/uploads/work-plans/001-initial
```

The selector groups labels by Feature and shows aggregate checklist/review state. It ends with a manual-path option. Only approved/active/blocked, incomplete Plans are selectable. New Plans are intentionally written as `status: draft`: review them with `/mgood:plan-list`, then explicitly approve them with `/mgood:plan-approve` before `/mgood:plan-do`. Execution automatically resumes and advances phases/checklists in document order until completion or a genuine safety, external-access, user-decision, material-design, conflict, context, or tool boundary.

After completion, Work Plan execution is `completed`, review remains `pending`, and Feature becomes `review_pending`.

## Independent review

```text
/mgood:plan-review
/mgood:plan-review work-plans/uploads/work-plans/001-initial
```

Only completed Work Plans are selected. Review may inspect files/Git state and run safe existing checks. It writes one immutable report under the Work Plan's `reviews/`, updates review/Feature status, and appends Feature history. It does not fix implementation or create remediation.

For `changes-required`, run `/mgood:plan-make` and select the Review (or use `review=<path>`), review the new Plan with `/mgood:plan-list`, approve it with `/mgood:plan-approve`, then run `/mgood:plan-do` and `/mgood:plan-review` again.

## Storage and path safety

The only root is `work-plans/`. There is no root setting and no recursive search for similarly named directories. Direct/manual paths must:

- be repository-relative;
- exist;
- remain under the fixed root after `realpath` resolution;
- parse as the object required by that command.

Do not use `.mgood-pi/`; it is ignored local state reserved for memory/indexing. Workflow Markdown under the repository-root `work-plans/` directory is intended to be easy to upload, share, and commit deliberately.

## Non-interactive behavior

The four mutating commands (`/mgood:plan-make`, `/mgood:plan-approve`, `/mgood:plan-do`, and `/mgood:plan-review`) are TUI workflows. In print/json/rpc modes they fail closed with a concise diagnostic and perform no model turn or write. `/mgood:plan-list` is the read-only exception: it prints discovered status in every mode and never starts a model turn. Internal prompt Markdown is packaged implementation guidance rather than registered Pi commands; automation should pass validated fixed-root paths and accept that prompt policy is not an OS sandbox.

## Recovery

After interruption, run `/mgood:plan-do` and select the same Work Plan. `[>]`, `[!]`, RESULT, and Feature HISTORY identify the resume point; no phase/task ID is requested. A blocker should be retried when current evidence makes it resolvable within approved design.

If requirements, architecture/security, public behavior, compatibility, or acceptance must change, stop and use `/mgood:plan-make` to create another Work Plan. Do not edit completed PLAN/ACCEPTANCE or immutable Reviews after the fact.

## Troubleshooting

- **Command missing/collision:** inspect `pi list`, reload Pi, and remove a package defining the same `/mgood:plan-*` command. The plugin refuses to shadow any of its five public commands.
- **Object not listed:** confirm Schema v4 frontmatter and location under `work-plans`; legacy `docs/plans`, `tmp/plans`, and custom roots are not scanned.
- **Plan not executable:** it is usually still `status: draft`; use `/mgood:plan-list <plan-directory>` to read it, then `/mgood:plan-approve <plan-directory>`. It must then have incomplete checklist work.
- **Plan not reviewable:** execution must be completed.
- **Long run stops:** rerun `/mgood:plan-do`; the executor continues from durable state.

## Uninstall

```bash
pi remove -l "$(pwd)/plugins/plan-workflow" # project
pi remove /absolute/path/to/plugins/plan-workflow # user
```

Uninstall does not remove user-owned `work-plans` data or implementation changes.

## Known limits

- no automatic model switching, Git checkpoint, atomic multi-file transaction, or concurrent writer lock;
- frontmatter parsing is intentionally narrow rather than a general YAML parser;
- prompt-guided model actions are not an OS sandbox;
- independent review cannot prove checks that require unavailable external systems.
