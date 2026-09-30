# Changelog

## Unreleased

- Add confirmed `/mgood:git-commit-push-pr [constraints]`: a current-Agent feature-branch workflow that commits exact paths, pushes only a non-protected branch, and creates a pull request with `gh pr create`.
- **Breaking:** rename the former `/mgood:git-push` command to `/mgood:git-commit-push`; it is the confirmed current-Agent commit-and-push feature-branch workflow and accepts optional natural-language constraints. No legacy alias remains.
- Reject push destinations named `main`, `master`, `dev`, or `develop` (case-insensitive) in the simplified workflow and configured-upstream push core.
- **Breaking:** `/mgood:git-commit [constraints]` now permits best-effort semantic whole-file grouping only with a clean index and unstaged/untracked candidates. It avoids obviously unrelated files, retains all staged/mixed and risk hard stops, and leaves ambiguous remainder paths uncommitted rather than creating a default consolidate commit. Conventional project PNG resources are ordinary exact-path candidates and may be grouped with related source, Markdown, configuration, lockfile, or other project files; they do not stop solely because they are binary. Hidden custom-message, exact-path, and silent-success boundaries remain unchanged.

## 1.0.0

### Major Changes

- [`d31a17e`](https://github.com/musuyin/mgood-pi/commit/d31a17ea83464a00d849d5136aad59ff0b1e3bac) Thanks [@musuyin](https://github.com/musuyin)! - **Breaking:** `/mgood:git-commit [constraints]` now permits best-effort semantic whole-file grouping only when the index is clean and candidates are unstaged/untracked. It does not require absolute semantic proof but avoids obviously unrelated files; staged/mixed and risk hard stops remain, and ambiguous remainder paths stay uncommitted rather than receiving a default consolidate commit. Conventional project PNG resources are ordinary exact-path candidates: when reasonably related by their path, name, and repository role, they may be committed with source, Markdown, configuration, lockfile, or other project files instead of stopping solely because they are binary. The hidden `mgood-git-commit` custom-message contract, exact-path execution, silent short-SHA/message success, no preview/second confirmation, and independent configured-upstream push contract remain unchanged. The plugin does not perform provider planning, deterministic batching, or direct commit execution; `@mgood-pi/git` continues to expose no commit-only APIs.

- [#1](https://github.com/musuyin/mgood-pi/pull/1) [`aea584b`](https://github.com/musuyin/mgood-pi/commit/aea584bc83d15fc770b1b6b2c461d59a1a3aab09) Thanks [@musuyin](https://github.com/musuyin)! - Add confirmed `/mgood:git-commit-push-pr [constraints]`, which delegates a bounded feature-branch commit, push, and `gh pr create` sequence to the current Pi Agent. **Breaking:** rename the former `/mgood:git-push` command and `PUSH_COMMAND` export to `/mgood:git-commit-push` and `COMMIT_PUSH_COMMAND`; no legacy alias remains. The renamed command is a confirmed feature-branch commit-and-push workflow with optional natural-language constraints. The push-capable workflows and configured-upstream push core reject destinations named `main`, `master`, `dev`, or `develop` (case-insensitive).

### Patch Changes

- Updated dependencies [[`d31a17e`](https://github.com/musuyin/mgood-pi/commit/d31a17ea83464a00d849d5136aad59ff0b1e3bac), [`aea584b`](https://github.com/musuyin/mgood-pi/commit/aea584bc83d15fc770b1b6b2c461d59a1a3aab09)]:
  - @mgood-pi/git@1.0.0

## 0.1.0

- Initial Pi adapter for explicitly confirmed safe Git commands.
