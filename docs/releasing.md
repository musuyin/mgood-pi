# Independent package releases

`mgood-pi` is one npm-workspaces repository, but every non-private workspace package has its own npm version, changelog entries, and release lifecycle. A plugin can therefore ship without releasing unrelated plugins. Changesets writes changelog entries from local Git history; preparing versions does not require a GitHub personal access token.

## Publishable packages

| Package                   | Role                                      | User installation                                    |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `@mgood-pi/core`          | Shared contracts for plugins              | Internal dependency; normally not installed directly |
| `@mgood-pi/plugin-market` | Curated marketplace and bootstrap preview | `pi install npm:@mgood-pi/plugin-market`             |
| `@mgood-pi/plan`          | Focused `/mgood-pi:plan` mode             | `pi install npm:@mgood-pi/plan`                      |
| `@mgood-pi/git`           | Git safety core                           | Internal dependency; normally not installed directly |
| `@mgood-pi/plugin-git`    | Safe current-Agent Git commands           | `pi install npm:@mgood-pi/plugin-git`                |

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

Changesets updates internal dependency ranges after versions are calculated. Do not manually change package versions for ordinary feature work. The explicit first-stable release is the exception: its Changesets intentionally calculate 1.0.0 for every publishable workspace.

## CI validation

[CI](../.github/workflows/ci.yml) runs for pull requests, pushes to `main`, and manual validation. It installs the locked dependencies, runs `npm run check`, and performs `npm pack --workspaces --dry-run`. CI never publishes packages or changes versions.

## Version preparation

Publishing is a deliberate two-step process. First, prepare and review a version commit on a branch:

```bash
npm ci
npm run check
npm run version-packages
git add .changeset package.json package-lock.json 'packages/*/package.json' 'plugins/*/package.json' 'packages/*/CHANGELOG.md' 'plugins/*/CHANGELOG.md'
git commit -m "chore: version packages"
git push origin <version-branch>
```

Open a pull request for that commit, wait for CI, review the exact version, changelog, dependency-range, and lockfile changes, then merge it into `main`. `npm run version-packages` consumes the pending Changesets and updates versions and internal dependency ranges. Do not publish directly from an unmerged branch.

## Manual npm staging and 2FA promotion

[Stage packages for npm release](../.github/workflows/release.yml) is intentionally available only through **Run workflow** in GitHub Actions. Start it from `main`, type `STAGE` exactly, and approve the `npm-production` environment if it has required reviewers. The workflow checks out the current `main` head, installs locked dependencies, reruns repository and tarball validation, then stages every workspace version that is not already public.

The workflow never runs `changeset version`, creates commits, opens pull requests, directly publishes packages, or accepts a release ref other than `main`. It uses `npm stage publish` with npm provenance, so staged versions are unavailable to package consumers until a 2FA-enabled maintainer explicitly approves them. The staging script compares every workspace manifest version with the public npm registry and the staged-package list: it skips public versions and already-staged versions, then stages only missing versions. It also refuses to stage a plugin whose matching internal dependency is neither public nor staged.

### npm authentication

Create a granular npm token with **Read and write (stage only)** access to the `@mgood-pi` organization and save it as the `NPM_STAGE_TOKEN` GitHub Actions repository secret. The workflow supplies it only as `NODE_AUTH_TOKEN`. Never put a token in a repository file, command history, issue, or pull-request comment.

The workflow uses Node.js 22.22.2 and invokes npm 12.2.0 through `npx`, rather than mutating the runner's bundled npm installation, because staged publishing requires the `npm stage` command. It grants GitHub Actions `id-token: write` solely so npm can attach provenance to staged tarballs; the stage-only token remains the authority to create staged versions, and maintainer 2FA remains required to publish them. npm Trusted Publishing is not used for direct publishing by this workflow. If the project later adopts npm Trusted Publishing for direct publishing, design and review a separate workflow rather than silently changing this 2FA release boundary.

Before the first release, configure GitHub repository Settings → Environments → `npm-production` with at least one required reviewer. Restrict the workflow to maintainers with permission to run workflows.

### Approve staged packages

After the staging workflow succeeds, inspect exactly what is pending with the 2FA-enabled npm account:

```bash
npm login
npm whoami
npx --yes npm@12.2.0 stage list
```

For every expected package, inspect its metadata and optionally download its tarball before approving it:

```bash
npx --yes npm@12.2.0 stage view <stage-id>
npx --yes npm@12.2.0 stage download <stage-id>
npx --yes npm@12.2.0 stage approve <stage-id>
```

`npm stage approve` prompts for your npm 2FA code and makes that one staged version public using the tag fixed at staging time (normally `latest`). Approve shared dependencies before dependent plugins. For this first release, use this order:

```text
@mgood-pi/core@1.0.0
@mgood-pi/git@1.0.0
@mgood-pi/plan@1.0.0
@mgood-pi/plugin-market@1.0.0
@mgood-pi/plugin-git@1.0.0
```

If a staged version is unexpected or fails inspection, do not approve it. Remove it with 2FA instead:

```bash
npx --yes npm@12.2.0 stage reject <stage-id>
```

Finally, verify the public registry:

```bash
npm view @mgood-pi/core version
npm view @mgood-pi/git version
npm view @mgood-pi/plan version
npm view @mgood-pi/plugin-market version
npm view @mgood-pi/plugin-git version
```

## Local maintainer fallback

Use a local stage only if GitHub Actions is unavailable. Work from a clean, up-to-date `main` commit that already contains the reviewed version changes:

```bash
npm ci
npm run check
npm pack --workspaces --dry-run
npm run stage-release-packages
```

Then inspect and promote the staged packages with the same `npx npm@12.2.0 stage list`, `stage view`, and 2FA-protected `stage approve` sequence above.

Never publish packages that contain local Pi sessions, credentials, project memory, generated `dist` directories, or test fixtures unrelated to package runtime behavior.
