# Changesets

Every pull request that changes a publishable package must include a changeset, unless it only changes internal tooling, CI, or documentation.

Create one with:

```bash
npm run changeset
```

Choose every affected package and its semver impact:

- `patch` — compatible bug fix, documentation shipped with a package, or metadata fix.
- `minor` — backwards-compatible capability, such as a new command or prompt workflow.
- `major` — a breaking command, configuration, storage, or exported-contract change.

Do not manually edit package versions. A maintainer prepares a reviewed version commit with `npm run version-packages`; it consumes Changesets, updates versions and internal dependency ranges, and writes package changelogs. GitHub Actions publishes only the version commit manually approved on `main`.
