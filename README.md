# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, explicit durable memory, and reusable agent-assisted commands. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

Current user-facing capabilities are:

- `@mgood-pi/plugin-market` — `/mgood:init` previews project bootstrap files, and `/mgood:market` installs a selected curated plugin only after explicit confirmation.
- `@mgood-pi/plan` — `/mgood-pi:plan` clarifies a request, confirms the brief, investigates repository evidence, and writes one implementation-ready Markdown file under `tmp/plans/`.
- `@mgood-pi/plugin-git` — in-progress one-command commit, push, and pull-request workflows. Real Pi TUI/disposable-repository acceptance is not yet recorded, so this feature is not complete or released. See the [Safe Git feature guide](./docs/features/git/README.md).

## Layout

- `packages/core` — framework-neutral contracts shared by plugins, including the curated catalog.
- `packages/git` — framework-neutral configured-upstream push-safety core and bounded Git executor.
- `plugins/plan` — focused `/mgood-pi:plan` extension and private bundled planning guidance.
- `plugins/git` — TUI-only launchers for commit, confirmed commit-push, and confirmed commit-push-PR.
- `plugins/market` — `/mgood:init` and `/mgood:market` extension.
- `docs/features` — maintained documentation for implemented capabilities.
- `tmp/plans` — generated local Markdown plans; `tmp/` is normally ignored rather than committed.

Future plugins and packages follow [`AGENTS.md`](./AGENTS.md).

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Pi 0.84.2 or compatible

## Development

```bash
npm install
npm run check
```

Run extensions directly with Pi:

```bash
pi -e ./plugins/market
pi -e ./plugins/plan
```

Create a plan:

```text
/model
/mgood-pi:plan Add a recoverable operation
```

Plan first restates the request and questions decisions that could materially affect scope, behavior, compatibility, security, or acceptance. After the brief is confirmed, it investigates the repository and creates one descriptive file such as `tmp/plans/add-recoverable-operation.md`. It does not implement, resume, review, or track the plan. See the [Plan feature guide](./docs/features/plan/README.md).

## Installation and independent releases

Each plugin is independently versioned and published from this monorepo. Install only the capabilities you need:

```bash
pi install npm:@mgood-pi/plugin-market
pi install npm:@mgood-pi/plan
pi install npm:@mgood-pi/plugin-git
```

Package manifests declare their extensions through `pi` fields. Plan's bundled Markdown guidance is private rather than a public prompt command. No plugin is globally enabled or trusted automatically. In an interactive Pi session, `/mgood:market` presents a curated version-pinned catalog, asks for global or project scope, shows the exact source and capabilities, and requires confirmation before running Pi's supported installer. Contributors should follow the [independent release guide](./docs/releasing.md).

## Security and data handling

- `/mgood:init` performs no network, subprocess, Git, or persistent-storage operation. `/mgood:market` runs `pi install` only after explicit confirmation of a curated source and scope, and never invokes a shell.
- `/mgood-pi:plan` injects private guidance as a hidden custom session message. The request and guidance remain in model/session context and may appear in local sessions or exports. The guidance permits only one new `tmp/plans/*.md` file and prohibits implementation and Git changes, but model instructions are not an OS sandbox. Review generated plans before acting on them.
- The in-progress Git commands use hidden current-Agent prompts and explicit confirmation for push-capable actions. See the [Git command contract](./docs/plugin-contracts/git-commands.md) and [security review](./docs/security/git-commands.md).
- Future MCP, skill, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and temporary plans are ignored by Git via [`.gitignore`](./.gitignore).

## License

Released packages are licensed under [MIT](./LICENSE).
