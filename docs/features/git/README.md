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
/mgood:git-push
```

没有旧短命令别名，也没有 model-callable Git write tool。

### Commit v8：隐藏 custom-message 的当前 Agent 一键工作流

`/mgood:git-commit` 是 thin launcher。仅当 `ctx.mode === "tui"`、UI 可用且当前 Agent idle 时，它才从插件包内读取 Markdown Prompt，把可选参数作为**纯文本附加约束**替换，并通过 Pi public `sendMessage()` 恰好发送一条 `{ customType: "mgood-git-commit", content, display: false }` custom message 和 `{ triggerTurn: true }`。调用命令本身是一次 Git-write 授权。它不自行检查 repository、调用 `modelRegistry.complete()`、生成计划、显示插件确认、stage、commit 或 push。busy、非 TUI、Prompt 读取或 send 失败时零注入、零 Git/provider 工作，并给出不回显 Prompt/参数的可操作提示。

`display: false` 只隐藏 injected Prompt 在 TUI transcript 中的渲染；它不是实际用户消息、secret channel、不可导出数据或 capability sandbox。内容仍进入当前 Agent 的 LLM context，且可能留在本地 Pi session 或 export。handler 不使用 `details` 复制 Prompt、用户约束、Git diff 或 credentials。

Prompt 要求当前 Agent 复用已有对话上下文和标准 tools，只在 invocation current worktree 中检查 status、staged/unstaged diff、相关 untracked 内容、近期 log 和必要文件；识别用户改动、生成物、secrets、submodule/nested repository、conflict/sequencer、detached HEAD、binary/不可安全读取内容等风险。**只有 index 无 staged path 且候选仅为 unstaged/untracked whole files 时**，Agent 才可按功能、依赖和可审查性尽力决定 whole-file commits：跨目录同功能可以同组，同目录不同功能可以拆组；不使用目录、文件数量或固定 commit 数量 batching。尽力不要求绝对语义证明，但不得包含明显无关文件。

正常路径不显示计划、不列文件、不输出理由或完整 diff，也不等待二次确认。任何 existing staged/mixed 内容、operation/scope uncertainty、submodule/nested、obvious secret/binary/unsafe/generated 内容或必须 hunk 拆分的文件均零 commit 停止。Agent 可先提交可合理归类 groups；剩余文件若无法避免明显无关关系，必须保留未提交并简洁报告 paths/reason，绝不创建默认 `chore`/consolidate commit。每次 commit 前必须检查 drift 和 staged membership，使用精确 paths（例如 `git add -- <exact paths>`、`git commit -m <message>`）。禁止 `git add .`、`git add -A`、`git commit -a`、reset/restore/checkout/clean/stash、amend/rebase/force、shell 生成路径列表、历史改写和自动 push。hook、drift、意外 staged 内容、取消、命令失败或 partial sequence 都要求立刻停止，保留已成功 commits，并报告 SHA/message、失败阶段和最终 `git status --short` 摘要；不自动 rollback、retry、replan 或恢复。成功仅显示 short SHA/message 与简短完成状态。

这是对当前 Agent 的**行为合同，不是 core-enforced capability sandbox**。Pi bash、用户 shell、hooks、credential helpers、SSH agents、transport、server policy 和其他扩展仍以本地用户权限运行；需要强制权限隔离时必须另行配置 Pi/tool policy。

### Push v2 边界保持

`/mgood:git-push` 严格零参数，只将 current attached branch 用 exact fully-qualified refspec 推送到 configured upstream。它不猜 `origin` 或 `push.default`，不 force、不 push tag/delete、不开/改 upstream、fetch/pull/retry。插件显示脱敏 preview，获得独立一次确认后由 core 复验 HEAD、branch、upstream、remote identity 与 destination，再通过 direct argv 执行。commit Prompt 不会自动调用它；网络/credential/helper/server 的结果可能不确定，用户必须检查 remote 后手动发起新命令。

## 数据、权限与恢复

插件加载时不启动 Git、网络、timer、watcher 或后台 process。commit launcher 仅在用户调用时读取 Prompt 并注入消息。push core 的 Git 子进程采用 argv vector、explicit cwd、`GIT_TERMINAL_PROMPT=0`、timeout/output limit 和脱敏 diagnostics；公开 preview/错误不会泄露 remote URL credentials，raw remote identity 仅用于内存 fingerprint。

详见 [命令合同](../../plugin-contracts/git-commands.md)、[安全审查](../../security/git-commands.md) 与 [ADR 0008](../../adr/0008-one-click-agent-commits.md)。

## 手动验收

只在经授权的 disposable repository 和 local bare remote 中测试，绝不在开发 checkout 或 live remote 中 commit/push。发布前必须记录真实 Pi version、TTY/model、脱敏 session transcript 和前后 Git evidence：一次调用的语义拆分与安静成功、no-change、staged/mixed safe-stop、计划/执行 drift、hook partial success、窄终端、无自动 push，以及独立 local-bare push。mock/unit test 不能替代此证据。
