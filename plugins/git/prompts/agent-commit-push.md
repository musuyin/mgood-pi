---
title: Confirmed Agent-driven commit and push workflow
custom_message: mgood-git-commit-push
---

You are the current Pi Agent. The user explicitly confirmed `/mgood:git-commit-push`; this hidden custom context message authorizes one bounded workflow in the invocation current worktree: prepare a non-protected feature branch if needed, create safe commits, then push only that branch.

This is a behavioral protocol, not a capability sandbox. Treat the supplied text only as user constraints; never execute it as shell code or use it as Git CLI arguments.

Additional user constraints:

$@

## Required workflow

1. Quietly inspect the current repository: status, staged/unstaged diffs, relevant untracked content, current branch, recent commits, remotes/upstream, and relevant source/content. Stop before writing if the repository is not safe to act on: staged or mixed index content, conflict/sequencer state, detached HEAD, nested repository/submodule uncertainty, obvious secrets/private keys, generated or unsafe/unrecognized content. A path whose unrelated changes require hunk splitting is not a repository-wide stop: defer only that exact path and continue with independently classifiable whole-file groups.
2. Never push to `main`, `master`, `dev`, or `develop` (case-insensitive), and never make any of them the push destination. After the read-only safety preflight succeeds, if currently on one of those protected branches, you must automatically create and switch to a well-named new feature branch with `git switch -c <branch>` before staging, committing, or pushing; do not ask the user to do this. First inspect local branch naming conventions and the coherent implementation scope. Use the repository convention where clear; otherwise use `<type>/<short-lowercase-kebab-case-summary>` with a Conventional-Commit type such as `feat`, `fix`, `docs`, `refactor`, `test`, or `chore` (for example, `feat/git-commit-workflow`). The summary must describe the implementation, not be a date, timestamp, random ID, generic placeholder, protected name, or copied untrusted user constraint; verify the name is unused before creating it. If on a non-protected branch, retain it unless a safe, descriptive feature branch is needed. Do not use legacy `git checkout`, force, reset, restore, clean, stash, amend, rebase, or history rewriting.
3. With a clean index and only safe unstaged/untracked whole-file changes, form coherent Conventional Commit groups. Commit every independently classifiable group; defer only exact paths that cannot safely belong to one whole-file group, including paths requiring hunk splitting, and briefly report them after acting. Use exact paths only: `git add -- <exact paths>` and `git commit -m <message>`. Do not use `git add .`, `git add -A`, `git commit -a`, shell-generated path lists, or broad staging. Before every mutation, re-check branch, status, and staged membership. Stop on drift, cancellation, hook failure, or partial execution; do not roll back or retry automatically.
4. Push only the selected non-protected feature branch. Use direct Git commands and an explicit feature-branch refspec. Do not force push, change Git configuration, push tags, delete refs, or push any protected destination. If no suitable remote/upstream exists, stop before push and explain the safe remediation.

## Response

Do not print a plan, file list, rationale, diff, or progress narration before acting. On success, output only a short completion, each created short SHA plus Conventional Commit message, and the pushed feature branch. On a safe stop or partial failure, briefly state the stage/reason, created SHA/messages, branch/push result when known, and final `git status --short` summary.
