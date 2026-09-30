# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, explicit durable memory, and reusable prompt workflows. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

The repository is initialized as an npm-workspace TypeScript monorepo. Current user-facing capabilities are:

- `@mgood-pi/plugin-market` — `/mgood:init` previews the planned project bootstrap layout, and `/mgood:market` safely installs a selected curated plugin after explicit confirmation.
- `@mgood-pi/plugin-plan-workflow` — TUI-only `/mgood:plan` for lightweight local plans under `tmp/work-plans/`, with one living `PLAN.md` and append-only `REVIEW.md`. Model selection remains explicit through Pi's built-in `/model` command.
- `@mgood-pi/plugin-git` — three in-progress one-command workflows: `/mgood:git-commit [constraints]` safely commits; `/mgood:git-commit-push [constraints]` confirms then creates a feature-branch commit and push; `/mgood:git-commit-push-pr [constraints]` also creates a PR. Push-capable workflows never push to `main`/`master`/`dev`/`develop` and prohibit force or history rewrites. Real Pi TUI/disposable-repository acceptance is not yet recorded, so this feature is not complete or released. See the [Safe Git feature guide](./docs/features/git/README.md).

## Layout

- `packages/core` — framework-neutral contracts shared by plugins.
- `packages/plan-workflow` — framework-neutral Schema v5 local `PLAN.md` and `REVIEW.md` discovery.
- `packages/git` — framework-neutral configured-upstream push-safety core and bounded Git executor; commit workflows are delegated to the current Agent through private plugin prompts.
- `plugins/plan-workflow` — interactive Plan Workflow adapter and bundled prompts.
- `plugins/git` — TUI-only current-Agent launchers for one-command commit, confirmed commit-push, and confirmed commit-push-PR.
- `plugins/market` — Pi extension adapter for `/mgood:init` and `/mgood:market`.
- `docs/features` — maintained wiki-style documentation owned by each implemented feature, including clearly marked planned features.
- `tmp/work-plans` — local, user-managed Plan and Review workbench state; it is normally ignored rather than committed.
- Future plugins and packages follow the boundaries defined in [`AGENTS.md`](./AGENTS.md).

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Pi 0.84.2 or compatible

## Development

```bash
npm install
npm run check
```

Run the development extension directly with Pi:

```bash
pi -e ./plugins/market/src/index.ts
```

Try the Plan Workflow package for one Pi run:

```bash
pi -e ./plugins/plan-workflow
```

Then select a model explicitly and start or resume a local plan:

```text
/model
/mgood:plan add a recoverable operation
/mgood:plan tmp/work-plans/<feature>
```

Local workflow data lives only under `tmp/work-plans/`. Each feature has a living `PLAN.md` and an append-only `REVIEW.md`. `/mgood:plan` provides read, continue, in-place adjustment, acceptance review, and explicit local discard actions. Small changes remain in the same Plan; a review with `changes-needed` returns focused work to that Plan. The plugin never edits `.gitignore`; users decide whether `tmp/` is ignored or retained.

See the [Plan Workflow feature wiki](./docs/features/plan-workflow/README.md) for its package contract, safety rules, and operation guide.

## Installation and independent releases

Each plugin is independently versioned and published from this monorepo. Install only the capabilities you need:

```bash
pi install npm:@mgood-pi/plugin-market
pi install npm:@mgood-pi/plugin-plan-workflow
pi install npm:@mgood-pi/plugin-git
```

The package manifests declare their extensions through `pi` fields. Plan Workflow's bundled internal Markdown guidance is deliberately not registered as public prompt commands. No plugin is globally enabled or trusted by this repository automatically. In an interactive Pi session, `/mgood:market` presents a curated version-pinned catalog, asks for global or project scope, shows the exact source and capabilities, and requires confirmation before it runs Pi's supported installer. Contributors should follow the [independent release guide](./docs/releasing.md), which uses Changesets and a GitHub Release PR to version and publish only changed packages.

## Security and data handling

- `/mgood:init` has no network, subprocess, Git, or persistent-storage behavior. `/mgood:market` starts `pi install` only after the user explicitly selects a curated entry and confirms its exact source and scope; it never runs a shell command or installs arbitrary user-provided sources.
- Plan Workflow's extension reads fixed-root Schema v5 local-plan metadata and dispatches bundled internal guidance as hidden custom session messages. TUI-only `/mgood:plan` creates, reads, continues, adjusts, reviews, or explicitly discards local `tmp/work-plans/` state. It does not modify `.gitignore`, Git state, or formal project documentation automatically. Prompt-guided model actions are not an OS sandbox.
- The in-progress Git commands use hidden current-Agent prompts: `/mgood:git-commit` only commits; `/mgood:git-commit-push` confirms in the TUI before committing and pushing only a non-protected feature branch; `/mgood:git-commit-push-pr` also runs `gh pr create`. When a push-capable command starts on `main`/`master`/`dev`/`develop` (case-insensitive), the Agent first inspects naming conventions and implementation scope, then automatically creates and switches to a meaningful unused feature branch with `git switch -c <branch>` before staging, committing, or pushing. Users do not need to check out a branch manually. Without a convention, it uses a Conventional-Commit type and short lowercase-kebab-case summary, such as `feat/git-commit-workflow`. Both workflows prohibit protected destinations, force, configuration changes, and history rewrites. Hidden prompts remain in LLM context and may be retained in local sessions or exports; they are behavioral protocols rather than sandboxes. `packages/git` retains a standalone configured-upstream push core with direct Git argv, explicit cwd, disabled terminal credential prompts, time/output bounds, redacted diagnostics, and raw remote identity fingerprints, but the plugin does not expose it as a slash command. Hooks, helpers, transport, and server policy are outside the boundary. See the [Git command contract](./docs/plugin-contracts/git-commands.md) and [security review](./docs/security/git-commands.md).
- Future MCP, skill, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and future local memory database/index files are ignored by Git via [`.gitignore`](./.gitignore).

## License

Released packages are licensed under [MIT](./LICENSE).
