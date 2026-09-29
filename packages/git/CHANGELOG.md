# Changelog

## Unreleased

- **Breaking:** remove core commit planning, batching, validation, and execution APIs. Commit behavior is now the current-Agent workflow owned by `@mgood-pi/plugin-git`'s private Prompt.
- Preserve the configured-upstream-only push contract.

## 0.1.0

- Initial safe Git core for explicit staged commits and configured-upstream pushes.
