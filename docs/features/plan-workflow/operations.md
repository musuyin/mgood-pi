# Local Plan Workflow operations

## Start or resume

```text
/mgood:plan Add retry messaging
/mgood:plan
/mgood:plan tmp/work-plans/retry-messaging
```

The command is TUI-only. It is the sole public Plan Workflow entry point.

- A request creates a new local Feature plan.
- No argument selects a discovered local plan or accepts a new request.
- A local plan directory opens actions: read, continue, update, review, or discard.

## Read and update

**Read Plan** displays `PLAN.md` without a model turn or write.

**Update Plan** asks for a small adjustment, then dispatches the planner to update the same `PLAN.md`. It must preserve completed checklist items and append an adjustment-log entry. Use it for normal implementation discoveries; do not create a new local feature just to correct a small point.

## Continue and review

**Continue implementation** dispatches the executor for the selected local plan. It advances the ordered checklist and records current progress in `PLAN.md`.

**Run acceptance review** dispatches a read-only implementation review. It appends one dated verdict to `REVIEW.md`:

- `pass`
- `changes-needed`
- `blocked`

For `changes-needed`, the reviewer adds focused next steps back to the same `PLAN.md`; it does not create a remediation plan.

## Discard

**Discard local Plan** requires TUI confirmation and deletes only the selected directory below `tmp/work-plans/`. It does not modify Git or `.gitignore`. Do not discard a plan whose notes you still need; instead explicitly ask the agent to turn stable conclusions into repository documentation.

## Storage and safety

The only workflow root is `tmp/work-plans/`. Manual paths must be repository-relative plan directories that exist under that root after canonical `realpath` resolution. The plugin rejects absolute paths, traversal, symlink escapes, files, and the legacy repository-root `work-plans/` tree.

The plugin does not modify `.gitignore`; users decide whether `tmp/` is ignored. Planning, execution, and review are hidden custom session messages: they remain in LLM context and local session data but do not render the internal prompt in the TUI.

The plugin never stages, commits, pushes, resets, cleans, stashes, checks out, rewrites Git history, or edits formal project documentation automatically.
