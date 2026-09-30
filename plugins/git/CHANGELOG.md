# Changelog

## Unreleased

- Add confirmed `/mgood:git-commit-push-pr [constraints]`: a current-Agent feature-branch workflow that commits exact paths, pushes only a non-protected branch, and creates a pull request with `gh pr create`.
- **Breaking:** rename the former `/mgood:git-push` command to `/mgood:git-commit-push`; it is the confirmed current-Agent commit-and-push feature-branch workflow and accepts optional natural-language constraints. No legacy alias remains.
- Reject push destinations named `main`, `master`, `dev`, or `develop` (case-insensitive) in the simplified workflow and configured-upstream push core.
- **Breaking:** `/mgood:git-commit [constraints]` now permits best-effort semantic whole-file grouping only with a clean index and unstaged/untracked candidates. It avoids obviously unrelated files, retains all staged/mixed and risk hard stops, and leaves ambiguous remainder paths uncommitted rather than creating a default consolidate commit. Conventional project PNG resources are ordinary exact-path candidates and may be grouped with related source, Markdown, configuration, lockfile, or other project files; they do not stop solely because they are binary. Hidden custom-message, exact-path, and silent-success boundaries remain unchanged.

## 0.1.0

- Initial Pi adapter for explicitly confirmed safe Git commands.
