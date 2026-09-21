# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, explicit durable memory, and reusable prompt workflows. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

The repository is initialized as an npm-workspace TypeScript monorepo. Current user-facing capabilities are:

- `@mgood-pi/plugin-market` — `/mgood:init` previews the planned project bootstrap layout, and `/mgood:market` safely installs a selected curated plugin after explicit confirmation.
- `@mgood-pi/plugin-plan-workflow` — bilingual `/make-plan` planning plus an interactive `/do-plan` plan/phase/task selector. Model selection remains explicit through Pi's built-in `/model` command.

## Layout

- `packages/core` — framework-neutral contracts shared by plugins.
- `packages/plan-workflow` — framework-neutral plan discovery and parsing.
- `plugins/plan-workflow` — interactive Plan Workflow adapter and bundled prompts.
- `plugins/market` — Pi extension adapter for `/mgood:init` and `/mgood:market`.
- `docs/features` — maintained wiki-style documentation owned by each implemented feature.
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

Then select models explicitly and use the bilingual planner and interactive executor:

```text
/model
/make-plan root=docs/plans 添加可恢复操作
/model
/do-plan
```

`/do-plan` opens plan → phase → task selectors and shows completed, running, blocked, and not-started states.

See the [Plan Workflow feature wiki](./docs/features/plan-workflow/README.md) for its package contract, safety rules, and operation guide.

## Installation and independent releases

Each plugin is independently versioned and published from this monorepo. Install only the capabilities you need:

```bash
pi install npm:@mgood-pi/plugin-market
pi install npm:@mgood-pi/plugin-plan-workflow
```

The package manifests declare their extensions and prompts through `pi` fields. No plugin is globally enabled or trusted by this repository automatically. In an interactive Pi session, `/mgood:market` presents a curated version-pinned catalog, asks for global or project scope, shows the exact source and capabilities, and requires confirmation before it runs Pi's supported installer. Contributors should follow the [independent release guide](./docs/releasing.md), which uses Changesets and a GitHub Release PR to version and publish only changed packages.

## Security and data handling

- `/mgood:init` has no network, subprocess, Git, or persistent-storage behavior. `/mgood:market` starts `pi install` only after the user explicitly selects a curated entry and confirms its exact source and scope; it never runs a shell command or installs arbitrary user-provided sources.
- Plan Workflow's extension reads plan metadata and dispatches the selected task; the active model performs planning/execution through bundled prompts and available Pi tools. `/make-plan` is limited to planning Markdown, while `/do-plan` authorizes one interactively selected task.
- Future MCP, skill, Git, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and future local memory database/index files are ignored by Git via [`.gitignore`](./.gitignore).

## License

Released packages are licensed under [MIT](./LICENSE).
