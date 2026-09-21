# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, explicit durable memory, and reusable prompt workflows. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

The repository is initialized as an npm-workspace TypeScript monorepo. Current user-facing capabilities are:

- `@mgood-pi/plugin-init` — a placeholder `/mgood:init` command that previews the planned project bootstrap layout without writing files.
- `@mgood-pi/plugin-plan-workflow` — bilingual `/make-plan` planning plus an interactive `/do-plan` plan/phase/task selector. Model selection remains explicit through Pi's built-in `/model` command.

## Layout

- `packages/core` — framework-neutral contracts shared by plugins.
- `packages/plan-workflow` — framework-neutral plan discovery and parsing.
- `plugins/plan-workflow` — interactive Plan Workflow adapter and bundled prompts.
- `plugins/init` — Pi extension adapter for `/mgood:init`.
- `docs/features` — maintained wiki-style documentation owned by each implemented feature.
- `docs/backlog` — parked feature ideas that are not yet executable plans.
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
pi -e ./plugins/init/src/index.ts
```

Try the Plan Workflow package for one Pi run:

```bash
pi -e ./plugins/plan-workflow
```

Then select models explicitly and use the bilingual planner and interactive executor:

```text
/model
/make-plan root=docs/plans 添加可恢复操作
/model
/do-plan
```

`/do-plan` opens plan → phase → task selectors and shows completed, running, blocked, and not-started states.

See the [Plan Workflow feature wiki](./docs/features/plan-workflow/README.md) for its package contract, safety rules, and operation guide. Future ideas, including opt-in [Work Memory & Task Recall](./docs/backlog/work-memory-task-recall.md), are parked separately until promoted with `/make-plan`.

## Installation and independent releases

Each plugin is independently versioned and published from this monorepo. Install only the capabilities you need:

```bash
pi install npm:@mgood-pi/plugin-init
pi install npm:@mgood-pi/plugin-plan-workflow
```

The package manifests declare their extensions and prompts through `pi` fields. No plugin is globally enabled or trusted by this repository automatically. Contributors should follow the [independent release guide](./docs/releasing.md), which uses Changesets and a GitHub Release PR to version and publish only changed packages.

## Security and data handling

- The init plugin has no network, subprocess, Git, or persistent-storage behavior.
- Plan Workflow's extension reads plan metadata and dispatches the selected task; the active model performs planning/execution through bundled prompts and available Pi tools. `/make-plan` is limited to planning Markdown, while `/do-plan` authorizes one interactively selected task.
- Future MCP, skill, Git, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and future local memory database/index files are ignored by Git via [`.gitignore`](./.gitignore).

## License

License selection is pending before the first public release.
