# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, and explicit durable memory. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

The repository is initialized as an npm-workspace TypeScript monorepo. The first package, `@mgood-pi/plugin-init`, registers a placeholder `/mgood:init` command that previews the planned Pi-native project bootstrap layout. It intentionally writes no files yet.

## Layout

- `packages/core` — framework-neutral contracts shared by plugins.
- `plugins/init` — Pi extension adapter for `/mgood:init`.
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

Then use `/mgood:init` in an interactive Pi session. The command uses a notification in TUI/RPC modes and prints a summary in non-interactive modes.

## Installation model

After publishing the public packages, the plugin will be installable as a Pi package:

```bash
pi install npm:@mgood-pi/plugin-init
```

The package manifest declares its extension in the `pi.extensions` field. No plugin is globally enabled or trusted by this repository automatically.

## Security and data handling

- The initial plugin has no network, subprocess, Git, or persistent-storage behavior.
- Future MCP, skill, Git, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and future local memory database/index files are ignored by Git via [`.gitignore`](./.gitignore).

## License

License selection is pending before the first public release.
