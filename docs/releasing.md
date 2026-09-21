# Independent package releases

`mgood-pi` is one npm-workspaces repository, but every non-private workspace package has its own npm version, changelog entries, and release lifecycle. A plugin can therefore ship without releasing unrelated plugins.

## Publishable packages

| Package                          | Role                                      | User installation                                    |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `@mgood-pi/core`                 | Shared contracts for plugins              | Internal dependency; normally not installed directly |
| `@mgood-pi/plugin-market`        | Curated marketplace and bootstrap preview | `pi install npm:@mgood-pi/plugin-market`             |
| `@mgood-pi/plan-workflow-core`   | Plan discovery/parsing implementation     | Internal dependency; normally not installed directly |
| `@mgood-pi/plugin-plan-workflow` | `/make-plan`, `/do-plan`, and prompts     | `pi install npm:@mgood-pi/plugin-plan-workflow`      |

A package is publishable when its `package.json` is not `private`, includes public npm metadata, and has `publishConfig.access: "public"`.

## Normal contributor workflow

1. Make the package change and update its tests/docs.
2. Create a changeset:

   ```bash
   npm run changeset
   ```

3. Select every affected package and the appropriate semver bump.
   - **patch:** compatible fix or metadata correction.
   - **minor:** backwards-compatible feature, command, prompt, or behavior.
   - **major:** breaking exported API, command/config contract, or persisted-data migration.
4. Commit the generated `.changeset/<name>.md` with the change.
5. Run:

   ```bash
   npm run check
   ```

Changesets updates internal dependency ranges after versions are calculated. Do not manually change package versions for ordinary feature work.

## Automated release flow

The [release workflow](../.github/workflows/release.yml) runs on pushes to `main`:

1. It validates the repository with `npm run check`.
2. If pending changesets exist, it opens or updates a **Version Packages** pull request.
3. The Version Packages PR runs `npm run version-packages`, which consumes changesets and updates package versions, dependency ranges, and changelogs.
4. Merging that PR triggers the workflow again. With no pending changesets, it publishes only packages whose npm version is not already published.

Repository maintainers must add an npm automation token as the `NPM_TOKEN` GitHub Actions secret. For scoped public packages, the npm organization/user must permit that token to publish under `@mgood-pi`.

## Manual maintainer release

Use this only when CI cannot be used. Work from a clean, up-to-date `main` branch:

```bash
npm ci
npm run check
npm run version-packages
git add .changeset package.json package-lock.json 'packages/*/package.json' 'plugins/*/package.json' 'packages/*/CHANGELOG.md' 'plugins/*/CHANGELOG.md'
git commit -m "chore: version packages"
npm run release-packages
```

`npm run release-packages` delegates to Changesets, which publishes versioned packages in dependency order. Verify npm output and retry a dependent plugin only after its newly-versioned dependency is visible in the registry.

## Preflight

Before merging a Version Packages PR or publishing manually, run:

```bash
npm run check
npm pack --workspace @mgood-pi/plugin-market --dry-run
npm pack --workspace @mgood-pi/plugin-plan-workflow --dry-run
```

Never publish packages that contain local Pi sessions, credentials, project memory, generated `dist` directories, or test fixtures unrelated to package runtime behavior.
