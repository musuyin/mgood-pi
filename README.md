# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, explicit durable memory, and reusable prompt workflows. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

The repository is initialized as an npm-workspace TypeScript monorepo. Current user-facing capabilities are:

- `@mgood-pi/plugin-market` — `/mgood:init` previews the planned project bootstrap layout, and `/mgood:market` safely installs a selected curated plugin after explicit confirmation.
- `@mgood-pi/plugin-plan-workflow` — bilingual TUI-only `/mgood:plan` for lightweight local plans under `tmp/work-plans/`, with one living `PLAN.md` and append-only `REVIEW.md`. Model selection remains explicit through Pi's built-in `/model` command.
- `@mgood-pi/plugin-git` — 实施中的统一三命令：`/mgood:git-commit [constraints]` 只安全提交；`/mgood:git-commit-push [constraints]` 经明确确认后执行 feature-branch commit + push；`/mgood:git-commit-push-pr [constraints]` 在此基础上创建 PR。两个 push-capable workflow 绝不 push 至 `main`/`master`/`dev`/`develop`，并禁止 force/rewrite。真实 Pi TUI/disposable-repository 验收尚未记录，发布前不可将其视为完成。参见[安全 Git 功能文档](./docs/features/git/README.md)。

## Layout

- `packages/core` — framework-neutral contracts shared by plugins.
- `packages/plan-workflow` — framework-neutral Schema v5 local `PLAN.md` and `REVIEW.md` discovery.
- `packages/git` — framework-neutral configured-upstream push safety core 和 bounded Git executor；commit 工作流由插件私有 Prompt 委托给当前 Agent。
- `plugins/plan-workflow` — interactive Plan Workflow adapter and bundled prompts.
- `plugins/git` — TUI-only current-Agent launchers for commit, confirmed commit-push, and confirmed commit-push-PR。
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
/mgood:plan 添加可恢复操作
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
- 实施中的 Git 命令统一以 current-Agent hidden Prompt 启动：`/mgood:git-commit` 只提交；`/mgood:git-commit-push` 在 TUI 确认后提交并只推送 non-protected feature branch；`/mgood:git-commit-push-pr` 在相同边界下再执行 `gh pr create`。若 push-capable workflow 从 `main`/`master`/`dev`/`develop`（大小写不敏感）启动，则在 read-only preflight 成功后 Agent 必须先检查仓库既有 branch 命名惯例和实现范围，再自动以 `git switch -c <branch>` 创建并切换有意义且未被使用的 feature branch，才开始 staging、commit 或 push；不会要求用户自行 checkout。没有明确惯例时使用 Conventional-Commit type 加简短 lowercase-kebab-case 摘要，例如 `feat/git-commit-workflow`，而非日期、随机 ID 或泛化占位名。两个 workflow 均禁止 protected destination、force、配置改写与历史重写。隐藏只影响 TUI transcript，内容仍进入 LLM context 且可能留在 local session/export；它们是行为协议而非 sandbox。`packages/git` 继续提供采用 direct Git argv、explicit cwd、disabled terminal credential prompts、time/output bounds、redacted diagnostics 与 raw remote identity fingerprint 的独立 configured-upstream push core，但插件不再把该 core 暴露为 slash command。hooks、helpers、transport 和 server policy 不在边界内。见 [Git command contract](./docs/plugin-contracts/git-commands.md) 与 [security review](./docs/security/git-commands.md)。
- Future MCP, skill, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and future local memory database/index files are ignored by Git via [`.gitignore`](./.gitignore).

## License

Released packages are licensed under [MIT](./LICENSE).
