# Installation and operations

## Install

Install the Pi-facing package, not the core package:

```bash
pi install -l ./plugins/plan-workflow
```

Omit `-l` for user-level settings. For one development run:

```bash
pi -e ./plugins/plan-workflow
```

The package bundles its core workspace dependency and declares one extension plus two prompts.

## Model and language

Templates use the active session model and never invoke `/model` themselves. Use a strong model for repository exploration/decision design and a cost-effective coding model for bounded tasks.

Language is selected from the planning request and persisted as `zh-CN` or `en`. To override detection, state the desired documentation language in the request.

## Interactive execution

Run:

```text
/do-plan
```

Use arrow keys to choose a plan, phase, and task. Plan rows show aggregate task counts; task rows show status symbols. Escape/cancel performs no agent turn and no write.

You can skip plan selection:

```text
/do-plan docs/plans/2026-09-21-example
```

For print/RPC/non-interactive use, supply exact identity directly:

```text
/execute-plan docs/plans/2026-09-21-example AUTH-101
```

## Clarification answers

When `/make-plan` returns a questionnaire, answer all IDs together:

```text
Q1=A, Q2=C: keep compatibility for 30 days, Q3=B
```

Or accept all recommendations:

```text
recommended
```

Continue the current session so the planner has its question context. If the session is lost, invoke `/make-plan <plan-directory-or-original-request>` again; no incomplete plan should have been written before decisions were resolved.

## Storage and recovery

| Use                   | Suggested root         | Expected Git behavior |
| --------------------- | ---------------------- | --------------------- |
| Shared feature wiki   | `docs/plans`           | Usually committed     |
| Personal exploration  | `tmp/plans`            | Usually ignored       |
| Repository convention | `root=<relative-path>` | User-managed          |

The extension reads only repository-local discovered plans and rejects plan-directory symlink escape. Prompt-level file policy still requires review because model tools are not sandboxed by this plugin.

After interruption, a task may be `[>]`. Select it again in `/do-plan`; the executor first reads RESULT/HISTORY and overlapping changes before resuming.

## Uninstall

```bash
pi remove -l ./plugins/plan-workflow
```

Plans and implementation changes remain user-owned and are not deleted.

## Troubleshooting

### `/do-plan` is missing or collides

Confirm `pi list` and `pi config`, then reload Pi. Disable any old prompt package that still owns a `do-plan.md` command; v0.2 reserves `/do-plan` for the extension selector. The extension detects an existing command and refuses to shadow it.

### A plan is not listed

Schema v2 requires README frontmatter with `plan_id` and at least one `phases/phase-*/PLAN.md`. Legacy v1 requires `plan_id` and a valid `current_implementation` pointer. Default roots are `docs/plans` and `tmp/plans`.

### A task is not parsed

Use the exact heading shape `- [ ] **PREFIX-001: Title**` and a supported marker (` `, `>`, `!`, `x`).

### Implementation differs from the plan

Do not rewrite the intended PLAN after the fact. Record a minor adaptation in RESULT, or stop and run `/make-plan <plan-directory> <change>` for a material re-plan.

## Remaining limitations

- no automatic model switching;
- no atomic multi-file transaction or concurrent edit lock;
- no enforced YAML schema parser yet;
- custom plan roots are usable by direct path but not yet configurable in selector discovery;
- prompt-guided writes are not an OS sandbox;
- no automatic Git checkpoint.
