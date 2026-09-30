# Git 命令合同（v7，实施中）

> **发布状态：** Work Plan 007 已批准，代码与自动检查正在执行；真实 Pi TUI/disposable-repository 验收、隔离安装/load smoke 和独立 Review 未完成。本文描述目标合同，不能把缺失人工证据写成已发布承诺；WP002–WP006 的历史状态独立保留。

## 用途与可用性

扩展只注册人类调用的命名空间命令：

```text
/mgood:git-commit [natural-language constraints]
/mgood:git-commit-push-pr [natural-language constraints]
/mgood:git-commit-push [natural-language constraints]
```

不提供旧短别名，也不注册模型可调用 Git 写工具。factory 不执行 Git、网络、timer 或 watcher。

## `/mgood:git-commit [constraints]`

### Handler 合同

commit handler 仅在 interactive TUI（`ctx.mode === "tui"` 且 `ctx.hasUI`）和当前 Agent idle 时，从已发布插件包内读取 Markdown Prompt、剥离 frontmatter、将可选 remainder 作为文本附加约束插入，并通过 Pi public `sendMessage()` **恰好一次**注入当前 session：`{ customType: "mgood-git-commit", content, display: false }` 与 `{ triggerTurn: true }`。不传 `details` 或 `deliverAs`。

命令调用本身是一次 Git-write 授权。handler 不检查 Git、不调用 provider 或 `modelRegistry.complete()`、不创建候选/批次/plan、不给出 plugin confirmation，也不执行 Git write。非 TUI、没有 UI、Agent busy、Prompt 不可读或 send 失败时，它安全返回提示且不发送部分工作流、不进行 Git/provider 调用。参数不是 shell 或 Git argv，Prompt 文件不通过公共 prompt-template 命令公开。`display: false` 只隐藏 TUI transcript；该 custom message 仍进入 LLM context，且可能留在本地 Pi session 或 export，不是 secret、非持久 channel 或 sandbox。

### 当前 Agent 一键协议

被注入的 Prompt 指示当前 Agent（不是 plugin/core/第二 provider）只处理 invocation current worktree，静默检查 status、staged/unstaged diff、相关 untracked 内容、近期 log 和必要内容，识别 staged/mixed 状态、生成物、secrets/私钥、submodule/nested repository、sequencer/conflict、detached HEAD、无法识别或 unsafe 内容和漂移等风险；常规项目 PNG 按其 exact path、名称和仓库角色作为普通资源判断，不因 binary 属性停止。Agent 根据功能、依赖和会话意图自主决定 whole-file membership、顺序和 Conventional Commit messages；没有目录、candidate、file-count、group-count 或 commit-count batching/限制。

命令不展示计划、不等待二次确认。只有 index 无 staged path、候选仅为 unstaged/untracked whole files 时，Agent 才可按功能/依赖/上下文作尽力分组：不要求绝对语义证明，但不得包含明显无关文件、不得按目录/数量/剩余机械分组。它必须先提交所有可独立归类的 whole-file groups，而非因其他无关路径停止。staged/mixed、operation/scope uncertainty、submodule/nested、obvious secret/私钥、无法识别或 unsafe/generated 仍使整个 workflow 零 commit 停止；但需要 hunk 拆分才能避免混合的单一路径只保留未提交，不阻止其他安全 groups。常规项目 PNG 不仅因 binary 属性停止：当其 exact path、名称与仓库角色表明和功能有合理关系时，可与相关 source、Markdown、configuration、lockfile 或其他项目资源同组提交。无法避免明显无关关系的 remainder（包括需 hunk 拆分的路径）必须保留并报告，不创建默认 `chore`/consolidate commit。它必须在每个 commit 前 re-inspect drift/staged membership，并使用 direct exact-path Git commands（例如 `git add -- <exact paths>`、`git commit -m <message>`）。禁止 `git add .`、`git add -A`、`git commit -a`、无路径 reset、`reset --hard`、restore、checkout、clean、stash、amend/rebase/force、shell 生成路径列表、history rewrite、自动 rollback/retry/replan 和自动 push。

hook、drift、意外 staged content、failure、cancellation 或 partial sequence 均要求立即停止并诚实报告 completed SHA/message、失败阶段和最终 `git status --short` 摘要；不得自动恢复已完成 commits。正常成功只报告 short SHA/message 加简短完成状态，默认不列 paths、plan、理由或 diff。

这是 Agent 行为指令，**不是权限 sandbox 或 core-enforced commit guarantee**。Pi standard tools、bash、hooks、credential helpers、transport、server policy、其他扩展和并发本地过程仍不受该 Prompt 强制控制。

## `/mgood:git-commit-push-pr [constraints]`

此简化 workflow 仅在 idle interactive TUI 中可用，并在注入隐藏 `mgood-git-commit-push-pr` current-Agent Prompt 前显示一次明确 confirmation。Prompt 依次检查安全状态、必要时用 `git switch -c <branch>` 建 descriptive feature branch、以 exact paths 创建 Conventional Commits、仅 push 该 feature branch，最后执行一次 `gh pr create`。若当前分支受保护，read-only preflight 成功后 Agent 必须自行创建并切换到 descriptive non-protected feature branch，且发生在 staging、commit 和 push 前，不要求用户自行 checkout。constraints 仅为文本，不能成为 shell/Git/GitHub argv。它不得 force push、merge、改配置或改写历史；任何风险、drift、hook/push/PR failure 都立即停止而不自动回滚或重试。

绝不允许 push destination 为 `main`、`master`、`dev` 或 `develop`（大小写不敏感）。这些 protected branches 可作为 PR base，却不能作为 push target；从其中任一分支启动时，Agent 必须自动先建立并切换 non-protected feature branch。此限制是 Prompt 的行为约束，不是 GitHub/server sandbox。

## `/mgood:git-commit-push [constraints]`

此命令统一为 confirmed current-Agent commit-and-push workflow。它在 idle interactive TUI 中显示一次明确 confirmation，接受后注入隐藏 `mgood-git-commit-push` Prompt；constraints 仅为文本，不能成为 shell/Git argv。Prompt 顺序执行安全检查、必要时 `git switch -c <branch>`、exact-path Conventional Commit(s)，并只 push 得到的 non-protected feature branch。若当前分支受保护，read-only preflight 成功后 Agent 必须自行创建并切换到 descriptive non-protected feature branch，且发生在 staging、commit 和 push 前，不要求用户自行 checkout。不得 force、删 ref/tag、改 Git config、fetch/pull/retry、rollback 或改写历史。

绝不允许 push destination 为 `main`、`master`、`dev` 或 `develop`（大小写不敏感）。从 protected branch 开始时，Agent 必须自动先建立并切换 non-protected feature branch。该限制是 Prompt 的行为约束，不是 GitHub/server sandbox；`@mgood-pi/git` 的 configured-upstream core 继续可作为独立库拒绝上述 destinations，但插件不再把它作为 slash command 暴露。

## 权限边界

| 能力                    | 允许范围                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Commit launcher         | idle interactive TUI 中加载私有 Prompt 并发送一条 current-Agent custom message                            |
| Commit execution        | current Agent 的一次授权行为协议；标准 tools 仍具本地用户权限，非技术 sandbox                             |
| Commit-push / commit-PR | confirmation 后的 current-Agent Prompt；只允许 non-protected feature branch push                          |
| 禁止（Prompt）          | broad/destructive Git、自动 hunk staging、amend/force/rewrite、protected push、自动 rollback/retry/replan |
| 独立 package push core  | 不接受任意 target/argv、force、upstream/config 改写、protected destination                                |

Push Git 子进程采用 argv vector、explicit cwd、`GIT_TERMINAL_PROMPT=0`、超时/输出限制和脱敏 diagnostics；外部副作用不由插件 sandbox 或回滚。
