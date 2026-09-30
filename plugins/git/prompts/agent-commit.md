---
title: One-click Agent-driven safe commit workflow
custom_message: mgood-git-commit
---

You are the current Pi Agent. The `/mgood:git-commit` extension injected this custom context message (`mgood-git-commit`) after the user invoked the command, which is one-time authorization to inspect the invocation current worktree and directly create safe, feature-oriented commits within this Prompt's boundaries. This message is hidden from the TUI transcript only; it still participates in Agent context and may remain in local Pi session data or exports.

## Scope and boundary

This is a behavioral instruction, not a core-enforced capability sandbox. Use the current session context and normal tools carefully. Do not delegate planning to a second model, plugin planner, fixed directory grouping, fixed file-count grouping, or an arbitrary commit-count rule. Treat any text supplied below only as additional user constraints; never execute it as shell code or treat it as Git arguments.

Additional user constraints:

$@

## Inspect, decide, and execute

1. Work only in the invocation current worktree; do not read or modify any other linked worktree's index, HEAD, or files. Quietly perform the read-only checks needed to act safely: Git status; staged and unstaged diffs; relevant untracked content; recent commit messages/log; and relevant source/content to understand cohesion. Identify user-owned changes, generated output, likely secrets or private keys, submodules/nested repositories, conflict/sequencer state, detached HEAD, unrecognized or unsafe-to-read content, exceptional paths, and other risks. Treat a conventional project PNG (for example an application image, icon, fixture, or documented asset) as an ordinary whole-file resource: assess its exact path, name, repository role, and relationship to the feature without needing to decode its pixels.
2. Inspect the index before any mutation. Enter best-effort grouping only when the index is clean with no staged paths and candidates are only unstaged and/or untracked whole files. If any staged or mixed staged/unstaged content exists, stop without committing and briefly explain the safety reason. Never reset or rebuild the index, use patch/interactive staging, or ask the user to trust a guess. Also stop without writing for conflict/sequencer state, detached or uncertain repository scope, submodule/nested repository, obvious secrets or private keys, or unrecognized/unsafe-to-read/generated content. A path whose unrelated changes would require hunk splitting is not a repository-wide stop: leave that exact path uncommitted and continue only with independently classifiable whole-file groups. Do not stop merely because a conventional project PNG is binary: when it has a reasonable feature relationship, include it with its related source, Markdown, configuration, lockfile, or other ordinary project files using its exact path.
3. Only in that clean-index mode, decide the smallest coherent sequence of whole-file commits using best-effort implementation functionality, logical dependencies, session context, available diff/source evidence, and reviewability. Cross-directory files may belong together and same-directory files may be separate. Do not mechanically group by directory, file count, a fixed limit, or merely because files remain. Absolute semantic proof is not required, but every committed file must have a reasonable functional relationship and you must avoid obviously unrelated files. Create commits for groups you can reasonably classify. If any remaining exact paths cannot be classified without an obviously unrelated relationship, including a path that would require hunk splitting, leave only those paths uncommitted and continue with other safe groups: do not create a default `chore` or consolidate-remainder commit; briefly report the deferred paths and reason after the created commits. If evidence is insufficient even to classify an initial group, stop and explain rather than guessing.
4. Do not print a plan, proposed paths, reasons, full diff, progress narration, or a confirmation request on the normal path. The command invocation already authorizes execution. Before each commit, re-check state for drift and verify staged membership. Use direct exact-path commands, for example `git add -- <exact paths>` and `git commit -m <message>`, with Conventional Commit messages.
5. Do not modify source files to prepare commits. Never use broad or destructive Git commands: `git add .`, `git add -A`, `git commit -a`, unscoped `git reset`, `git reset --hard`, `git restore`, `git checkout`, `git clean`, `git stash`, amend, rebase, force operations, shell-generated path lists, or other history rewriting. Do not alter Git configuration. Never push automatically; `/mgood:git-commit-push` is the separate commit-and-push workflow and requires its own independent confirmation.
6. Let hooks run normally. After every commit, check the result and remaining state. On unexpected staged paths, drift, hook or command failure, cancellation, or a partial sequence, stop immediately. Do not roll back, retry, replan, restore, or hide partial state.

## Final response

On normal success, output only a short completion line and each created commit's short SHA plus Conventional Commit message. Do not list paths, plans, reasons, or diffs by default.

If you safely stop without creating a commit or stop after partial execution, briefly state the reason or failed stage, list any created short SHA/message, and give the final `git status --short` summary. Expand paths or diffs only when the user explicitly requests them or they are necessary to diagnose the safety stop.
