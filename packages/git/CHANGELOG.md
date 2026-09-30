# Changelog

## Unreleased

- Reject configured-upstream push destinations named `main`, `master`, `dev`, or `develop` (case-insensitive).
- **Breaking:** remove core commit planning, batching, validation, and execution APIs. Commit behavior is now the current-Agent workflow owned by `@mgood-pi/plugin-git`'s private Prompt.
- **Breaking:** rename the exported `PUSH_COMMAND` constant to `COMMIT_PUSH_COMMAND`, whose value is `mgood:git-commit-push`; no legacy export remains. The deterministic configured-upstream push core remains a library capability rather than a plugin slash-command implementation.

## 1.0.0

### Major Changes

- [`d31a17e`](https://github.com/musuyin/mgood-pi/commit/d31a17ea83464a00d849d5136aad59ff0b1e3bac) Thanks [@musuyin](https://github.com/musuyin)! - **Breaking:** `/mgood:git-commit [constraints]` now permits best-effort semantic whole-file grouping only when the index is clean and candidates are unstaged/untracked. It does not require absolute semantic proof but avoids obviously unrelated files; staged/mixed and risk hard stops remain, and ambiguous remainder paths stay uncommitted rather than receiving a default consolidate commit. Conventional project PNG resources are ordinary exact-path candidates: when reasonably related by their path, name, and repository role, they may be committed with source, Markdown, configuration, lockfile, or other project files instead of stopping solely because they are binary. The hidden `mgood-git-commit` custom-message contract, exact-path execution, silent short-SHA/message success, no preview/second confirmation, and independent configured-upstream push contract remain unchanged. The plugin does not perform provider planning, deterministic batching, or direct commit execution; `@mgood-pi/git` continues to expose no commit-only APIs.

- [#1](https://github.com/musuyin/mgood-pi/pull/1) [`aea584b`](https://github.com/musuyin/mgood-pi/commit/aea584bc83d15fc770b1b6b2c461d59a1a3aab09) Thanks [@musuyin](https://github.com/musuyin)! - Add confirmed `/mgood:git-commit-push-pr [constraints]`, which delegates a bounded feature-branch commit, push, and `gh pr create` sequence to the current Pi Agent. **Breaking:** rename the former `/mgood:git-push` command and `PUSH_COMMAND` export to `/mgood:git-commit-push` and `COMMIT_PUSH_COMMAND`; no legacy alias remains. The renamed command is a confirmed feature-branch commit-and-push workflow with optional natural-language constraints. The push-capable workflows and configured-upstream push core reject destinations named `main`, `master`, `dev`, or `develop` (case-insensitive).

## 0.1.0

- Initial safe Git core for explicit staged commits and configured-upstream pushes.
