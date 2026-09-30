# 安全 Git 命令（v8 实施中）

> **状态：** Work Plan 008 已批准；代码、单元/回归测试、构建和 dry-run pack 正在执行。真实 Pi TUI + disposable repository 验收、隔离安装/load/command smoke 与独立 Review 尚未记录。不得把该功能视为已发布或已接受。WP002–WP007 的历史 `blocked`/`pending` 状态及其 RESULT/Review 不由本页改写。

功能由 `@mgood-pi/git`（独立 configured-upstream push safety core）和 `@mgood-pi/plugin-git`（Pi adapter）组成。发布后普通用户只安装插件：

```bash
pi install npm:@mgood-pi/plugin-git
# project local
pi install -l npm:@mgood-pi/plugin-git
```

需要 Node.js 22+、Git、兼容 Pi 0.84.2 的 interactive TUI。Git commit 工作流要求当前 Agent 空闲。

## 命令

```text
/mgood:git-commit [natural-language constraints]
/mgood:git-commit-push-pr [natural-language constraints]
/mgood:git-commit-push [natural-language constraints]
```

没有旧短命令别名，也没有 model-callable Git write tool。

### Commit v8：隐藏 custom-message 的当前 Agent 一键工作流

`/mgood:git-commit` 是 thin launcher。仅当 `ctx.mode === "tui"`、UI 可用且当前 Agent idle 时，它才从插件包内读取 Markdown Prompt，把可选参数作为**纯文本附加约束**替换，并通过 Pi public `sendMessage()` 恰好发送一条 `{ customType: "mgood-git-commit", content, display: false }` custom message 和 `{ triggerTurn: true }`。调用命令本身是一次 Git-write 授权。它不自行检查 repository、调用 `modelRegistry.complete()`、生成计划、显示插件确认、stage、commit 或 push。busy、非 TUI、Prompt 读取或 send 失败时零注入、零 Git/provider 工作，并给出不回显 Prompt/参数的可操作提示。

`display: false` 只隐藏 injected Prompt 在 TUI transcript 中的渲染；它不是实际用户消息、secret channel、不可导出数据或 capability sandbox。内容仍进入当前 Agent 的 LLM context，且可能留在本地 Pi session 或 export。handler 不使用 `details` 复制 Prompt、用户约束、Git diff 或 credentials。

Prompt 要求当前 Agent 复用已有对话上下文和标准 tools，只在 invocation current worktree 中检查 status、staged/unstaged diff、相关 untracked 内容、近期 log 和必要文件；识别用户改动、生成物、secrets/私钥、submodule/nested repository、conflict/sequencer、detached HEAD、无法识别或不可安全读取内容等风险；常规项目 PNG 按 exact path、名称和仓库角色作为普通资源判断，不必解析像素。**只有 index 无 staged path 且候选仅为 unstaged/untracked whole files 时**，Agent 才可按功能、依赖和可审查性尽力决定 whole-file commits：跨目录同功能可以同组，同目录不同功能可以拆组；不使用目录、文件数量或固定 commit 数量 batching。尽力不要求绝对语义证明，但不得包含明显无关文件。

正常路径不显示计划、不列文件、不输出理由或完整 diff，也不等待二次确认。existing staged/mixed 内容、operation/scope uncertainty、submodule/nested、obvious secret/私钥及无法识别或 unsafe/generated 内容仍使 workflow 零 commit 停止。Agent 必须先自动提交所有可合理归类的 whole-file groups；若单一路径必须 hunk 拆分才能避免混合，则只保留该路径未提交并简洁报告，不能阻止其他独立 group。常规项目 PNG（应用图片、图标、fixture 或文档资源）不因二进制属性停止：若其 exact path、名称和仓库角色与功能合理关联，可与相关源码、Markdown、配置、lockfile 或其他项目资源一起提交。剩余文件若无法避免明显无关关系，也必须保留未提交，绝不创建默认 `chore`/consolidate commit。每次 commit 前必须检查 drift 和 staged membership，使用精确 paths（例如 `git add -- <exact paths>`、`git commit -m <message>`）。禁止 `git add .`、`git add -A`、`git commit -a`、自动 hunk staging、reset/restore/checkout/clean/stash、amend/rebase/force、shell 生成路径列表、历史改写和自动 push。hook、drift、意外 staged 内容、取消、命令失败或 partial sequence 都要求立刻停止，保留已成功 commits，并报告 SHA/message、失败阶段和最终 `git status --short` 摘要；不自动 rollback、retry、replan 或恢复。成功仅显示 short SHA/message 与简短完成状态。

这是对当前 Agent 的**行为合同，不是 core-enforced capability sandbox**。Pi bash、用户 shell、hooks、credential helpers、SSH agents、transport、server policy 和其他扩展仍以本地用户权限运行；需要强制权限隔离时必须另行配置 Pi/tool policy。

### Commit-push-PR：确认后的 feature-branch 快捷 workflow

`/mgood:git-commit-push-pr [constraints]` 在 idle TUI 中先显示一次明确 confirmation；接受后才向 current Agent 注入隐藏 Prompt。它把用户已确认的操作限制为：安全检查、必要时建立 descriptive feature branch、exact-path commit、仅推送该 feature branch、最后运行 `gh pr create`。如果当前分支受保护，read-only preflight 成功后 Agent 必须自动以 `git switch -c <branch>` 创建并切换到该 feature branch，且发生在 staging、commit 和 push 前；不会要求用户自行 checkout。它不 force push、merge、改 Git config、改写历史、自动 rollback/retry。

Push destination 不得为 `main`、`master`、`dev` 或 `develop`（大小写不敏感）。如果从这些分支开始，Prompt 必须先 `git switch -c <branch>`；protected branch 可以作为 PR base，但绝不能是 push target。GitHub CLI auth/access 或 PR failure 时停止并报告，绝不继续执行其他 GitHub mutation。

### Commit-push：确认后的 feature-branch workflow

`/mgood:git-commit-push [constraints]` 统一为 current-Agent commit-and-push launcher。它在 idle TUI 中显示一次明确 confirmation，接受后注入隐藏 Prompt；Prompt 依次检查安全状态、必要时建立 descriptive feature branch、以 exact paths 创建 Conventional Commits，再仅 push 该 feature branch。如果当前分支受保护，read-only preflight 成功后 Agent 必须自动以 `git switch -c <branch>` 创建并切换到该 feature branch，且发生在 staging、commit 和 push 前；不会要求用户自行 checkout。它不 force、push tag/delete、改 Git config、fetch/pull/retry、改写历史或自动 rollback/retry。

Push destination 不得为 `main`、`master`、`dev` 或 `develop`（大小写不敏感）。从这些分支开始时必须先 `git switch -c <branch>`。这是 Agent 行为合同，不是 server sandbox。`@mgood-pi/git` 的 standalone configured-upstream core 继续保留 argv、explicit cwd、`GIT_TERMINAL_PROMPT=0`、timeout/output limit、credential-redacted diagnostics 与 protected destination rejection，但不再由插件 slash command 直接调用。

## 数据、权限与恢复

插件加载时不启动 Git、网络、timer、watcher 或后台 process。三个 launcher 仅在用户调用时读取 Prompt 并注入消息。commit-push 和 commit-push-PR 都需要单次明确确认；GitHub/transport/hooks/server 的结果仍由 Agent 和外部系统决定，失败后不会自动重试或回滚。

详见 [命令合同](../../plugin-contracts/git-commands.md)、[安全审查](../../security/git-commands.md) 与 [ADR 0008](../../adr/0008-one-click-agent-commits.md)。

## 手动验收

只在经授权的 disposable repository 和 local bare remote 中测试，绝不在开发 checkout 或 live remote 中 commit/push。发布前必须记录真实 Pi version、TTY/model、脱敏 session transcript 和前后 Git evidence：一次调用的语义拆分与安静成功、no-change、staged/mixed safe-stop、计划/执行 drift、hook partial success、窄终端、commit 不自动 push、确认后的 feature-branch commit-push，以及确认后的 commit-push-PR。mock/unit test 不能替代此证据。
