---
"@mgood-pi/git": major
"@mgood-pi/plugin-git": major
---

Add confirmed `/mgood:git-commit-push-pr [constraints]`, which delegates a bounded feature-branch commit, push, and `gh pr create` sequence to the current Pi Agent. **Breaking:** rename the former `/mgood:git-push` command and `PUSH_COMMAND` export to `/mgood:git-commit-push` and `COMMIT_PUSH_COMMAND`; no legacy alias remains. The renamed command is a confirmed feature-branch commit-and-push workflow with optional natural-language constraints. The push-capable workflows and configured-upstream push core reject destinations named `main`, `master`, `dev`, or `develop` (case-insensitive).
