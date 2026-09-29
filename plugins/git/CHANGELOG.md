# Changelog

## Unreleased

- **Breaking:** `/mgood:git-commit [constraints]` now permits best-effort semantic whole-file grouping only with a clean index and unstaged/untracked candidates. It avoids obviously unrelated files, retains all staged/mixed and risk hard stops, and leaves ambiguous remainder paths uncommitted rather than creating a default consolidate commit. Conventional project PNG resources are ordinary exact-path candidates and may be grouped with related source, Markdown, configuration, lockfile, or other project files; they do not stop solely because they are binary. Hidden custom-message, exact-path, silent-success, and independent push boundaries remain unchanged.
- Keep `/mgood:git-push` configured-upstream-only and strictly zero-argument.

## 0.1.0

- Initial Pi adapter for explicitly confirmed safe Git commands.
