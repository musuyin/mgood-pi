# mgood-pi

A composable plugin kit for a better [Pi](https://pi.dev) coding-agent experience.

`mgood-pi` focuses on TUI workflows, skillset management, MCP ergonomics, safe Git workflows, explicit durable memory, and reusable prompt workflows. It does **not** implement context-window management or low-level Pi runtime optimization.

## Status

The repository is initialized as an npm-workspace TypeScript monorepo. Current user-facing capabilities are:

- `@mgood-pi/plugin-market` — `/mgood:init` previews the planned project bootstrap layout, and `/mgood:market` safely installs a selected curated plugin after explicit confirmation.
- `@mgood-pi/plugin-plan-workflow` — bilingual `/mgood:plan-make`, read-only `/mgood:plan-list`, TUI-only `/mgood:plan-approve`, `/mgood:plan-do`, and `/mgood:plan-review` for a durable Feature → Work Plan → Phase → Review loop. Model selection remains explicit through Pi's built-in `/model` command.
- `@mgood-pi/plugin-git` — 实施中的 v9 `/mgood:git-commit [constraints]` 在空闲 TUI 向当前 Agent 注入 `display: false` 的 `mgood-git-commit` custom message；仅在 clean index 的纯未暂存/未跟踪 whole-file 变更中，Agent 可按功能尽力分组并以 exact paths 提交，成功仅显示 short SHA/message。尽力不要求绝对语义证明但避开明显无关文件；staged/mixed 与风险状态仍停止，ambiguous remainder 保留并报告而不创建默认收尾 commit。隐藏仅抑制 TUI transcript：内容仍进 Agent context且可能留在本地 session/export，不是 secret 或 sandbox，也从不自动 push。严格无参数的 `/mgood:git-push` 仍独立预览、确认并以精确 refspec 推送当前分支至已配置 upstream。真实 Pi TUI/disposable-repository 验收尚未记录，发布前不可将其视为完成。参见[安全 Git 功能文档](./docs/features/git/README.md)。

## Layout

- `packages/core` — framework-neutral contracts shared by plugins.
- `packages/plan-workflow` — framework-neutral Schema v4 Feature, canonical Work Plan Approval, Phase, and Review discovery.
- `packages/git` — framework-neutral configured-upstream push safety core 和 bounded Git executor；commit 工作流由插件私有 Prompt 委托给当前 Agent。
- `plugins/plan-workflow` — interactive Plan Workflow adapter and bundled prompts.
- `plugins/git` — TUI-only current-Agent commit Prompt launcher and independently confirmed configured-upstream push adapter。
- `plugins/market` — Pi extension adapter for `/mgood:init` and `/mgood:market`.
- `docs/features` — maintained wiki-style documentation owned by each implemented feature, including clearly marked planned features.
- `work-plans` — committed, upload-friendly Schema v4 Feature, Work Plan Approval, and Review data.
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

Then select models explicitly and use the bilingual planning loop:

```text
/model
/mgood:plan-make 添加可恢复操作
/model
/mgood:plan-list
/mgood:plan-approve
/model
/mgood:plan-do
/model
/mgood:plan-review
/mgood:plan-list
```

All workflow data lives under the single committed root `work-plans/`. Each Work Plan has one canonical `APPROVAL.md`; `/mgood:plan-list` reports state and reads the complete approval brief without a model turn, while TUI-only `/mgood:plan-approve` is the explicit `draft` → `approved` transition. A new draft may declare a same-Feature Plan that it supersedes; only approving the new Plan makes that replacement effective and preserves the old Plan as history. `/mgood:plan-do` and `/mgood:plan-review` select one Work Plan; phases/checklists advance internally. A `changes-required` Review can seed another Work Plan through `/mgood:plan-make` without mutating the old report.

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
- Plan Workflow's extension reads fixed-root Schema v4 metadata and dispatches bundled internal guidance for the selected Work Plan. `/mgood:plan-make` writes planning Markdown and can record replacement intent, TUI-only `/mgood:plan-approve` explicitly authorizes a draft Plan, records its audit fields, and makes any eligible declared supersession effective; `/mgood:plan-do` executes an approved Plan and its ordered phases, `/mgood:plan-review` writes an immutable Review without fixing implementation, and `/mgood:plan-list` is read-only and can read approval details. Prompt-guided model actions are not an OS sandbox.
- 实施中的 `/mgood:git-commit` 仅在 idle TUI 中加载 Prompt，并以 `display: false` 的 `mgood-git-commit` custom message 向当前 Agent 触发一轮执行；调用本身授权 Agent 在 current worktree 静默检查。只有 clean index 的纯 unstaged/untracked whole-file 候选可尽力按功能 exact-path 提交；它不保证绝对语义精确、也不包含明显无关文件，ambiguous remainder 保留并报告而非默认收尾。隐藏只影响 TUI transcript，内容仍进入 LLM context且可能留在 local session/export；并非 secret、非持久通道或 sandbox。handler 不检查 Git、不调用第二个 provider、不显示插件确认、也不直接 stage/commit/push；Prompt 禁止 broad/destructive Git、历史改写和自动 push，且 staged/mixed/风险状态、drift/hook/partial failure 时停止。严格无参数 `/mgood:git-push` 继续由 core 以 direct Git argv、explicit cwd、disabled terminal credential prompts、time/output bounds、idempotent terminal cleanup、redacted diagnostics 和 raw remote identity 内部 fingerprint 实施独立确认/复验。hooks、helpers、transport 和 server policy 不在边界内。见 [Git command contract](./docs/plugin-contracts/git-commands.md) 与 [security review](./docs/security/git-commands.md)。
- Future MCP, skill, and memory features must follow the approval, redaction, and user-control rules in [`AGENTS.md`](./AGENTS.md).
- Local Pi runtime state and future local memory database/index files are ignored by Git via [`.gitignore`](./.gitignore).

## License

Released packages are licensed under [MIT](./LICENSE).
