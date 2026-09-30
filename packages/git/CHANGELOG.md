# Changelog

## Unreleased

- Reject configured-upstream push destinations named `main`, `master`, `dev`, or `develop` (case-insensitive).
- **Breaking:** remove core commit planning, batching, validation, and execution APIs. Commit behavior is now the current-Agent workflow owned by `@mgood-pi/plugin-git`'s private Prompt.
- **Breaking:** rename the exported `PUSH_COMMAND` constant to `COMMIT_PUSH_COMMAND`, whose value is `mgood:git-commit-push`; no legacy export remains. The deterministic configured-upstream push core remains a library capability rather than a plugin slash-command implementation.

## 0.1.0

- Initial safe Git core for explicit staged commits and configured-upstream pushes.
