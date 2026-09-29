# Git 命令合同（v7，实施中）

> **发布状态：** Work Plan 007 已批准，代码与自动检查正在执行；真实 Pi TUI/disposable-repository 验收、隔离安装/load smoke 和独立 Review 未完成。本文描述目标合同，不能把缺失人工证据写成已发布承诺；WP002–WP006 的历史状态独立保留。

## 用途与可用性

扩展只注册人类调用的命名空间命令：

```text
/mgood:git-commit [natural-language constraints]
/mgood:git-push
```

不提供旧短别名，也不注册模型可调用 Git 写工具。factory 不执行 Git、网络、timer 或 watcher。

## `/mgood:git-commit [constraints]`

### Handler 合同

commit handler 仅在 interactive TUI（`ctx.mode === "tui"` 且 `ctx.hasUI`）和当前 Agent idle 时，从已发布插件包内读取 Markdown Prompt、剥离 frontmatter、将可选 remainder 作为文本附加约束插入，并通过 Pi public `sendMessage()` **恰好一次**注入当前 session：`{ customType: "mgood-git-commit", content, display: false }` 与 `{ triggerTurn: true }`。不传 `details` 或 `deliverAs`。

命令调用本身是一次 Git-write 授权。handler 不检查 Git、不调用 provider 或 `modelRegistry.complete()`、不创建候选/批次/plan、不给出 plugin confirmation，也不执行 Git write。非 TUI、没有 UI、Agent busy、Prompt 不可读或 send 失败时，它安全返回提示且不发送部分工作流、不进行 Git/provider 调用。参数不是 shell 或 Git argv，Prompt 文件不通过公共 prompt-template 命令公开。`display: false` 只隐藏 TUI transcript；该 custom message 仍进入 LLM context，且可能留在本地 Pi session 或 export，不是 secret、非持久 channel 或 sandbox。

### 当前 Agent 一键协议

被注入的 Prompt 指示当前 Agent（不是 plugin/core/第二 provider）只处理 invocation current worktree，静默检查 status、staged/unstaged diff、相关 untracked 内容、近期 log 和必要内容，识别 staged/mixed 状态、生成物、secrets、submodule/nested repository、sequencer/conflict、detached HEAD、binary/unsafe 内容和漂移等风险。Agent 根据功能、依赖和会话意图自主决定 whole-file membership、顺序和 Conventional Commit messages；没有目录、candidate、file-count、group-count 或 commit-count batching/限制。

命令不展示计划、不等待二次确认。只有 index 无 staged path、候选仅为 unstaged/untracked whole files 时，Agent 才可按功能/依赖/上下文作尽力分组：不要求绝对语义证明，但不得包含明显无关文件、不得按目录/数量/剩余机械分组。staged/mixed、operation/scope uncertainty、submodule/nested、obvious secret/binary/unsafe/generated 或需要 hunk 才能避免混合的文件均零 commit 停止。已合理归类 groups 可先提交；无法避免明显无关关系的 remainder 必须保留并报告，不创建默认 `chore`/consolidate commit。它必须在每个 commit 前 re-inspect drift/staged membership，并使用 direct exact-path Git commands（例如 `git add -- <exact paths>`、`git commit -m <message>`）。禁止 `git add .`、`git add -A`、`git commit -a`、无路径 reset、`reset --hard`、restore、checkout、clean、stash、amend/rebase/force、shell 生成路径列表、history rewrite、自动 rollback/retry/replan 和自动 push。

hook、drift、意外 staged content、failure、cancellation 或 partial sequence 均要求立即停止并诚实报告 completed SHA/message、失败阶段和最终 `git status --short` 摘要；不得自动恢复已完成 commits。正常成功只报告 short SHA/message 加简短完成状态，默认不列 paths、plan、理由或 diff。

这是 Agent 行为指令，**不是权限 sandbox 或 core-enforced commit guarantee**。Pi standard tools、bash、hooks、credential helpers、transport、server policy、其他扩展和并发本地过程仍不受该 Prompt 强制控制。

## `/mgood:git-push`

push 保持独立 v2 合同：严格零参数；任何非空文本在 inspection/preview/confirmation 前拒绝。只把 current attached branch 用完全限定 exact refspec 推送至 `branch.<current>.remote` / `.merge` 的 configured upstream；不猜测 `origin`/`push.default`，不 force、不删 ref/tag、不建/改 upstream、不 fetch/pull/retry。完整脱敏 preview 后一次确认；push 前 core 复验 HEAD、branch、upstream、remote identity 与 destination。公开 DTO/diagnostic 的 URL 永远脱敏，原始 URL 仅在 core 内部做单向 fingerprint。commit Prompt 不得调用 push。

## 权限边界

| 能力              | 允许范围                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Commit launcher   | idle interactive TUI 中加载私有 Prompt 并发送一条 current-Agent user message                          |
| Commit execution  | current Agent 的一次授权行为协议；标准 tools 仍具本地用户权限，非技术 sandbox                         |
| Push              | current attached branch → configured upstream exact refspec，经独立 preview/confirmation/revalidation |
| 禁止（Prompt）    | broad/destructive Git、hunk、amend/force/rewrite、自动 push、自动 rollback/retry/replan               |
| 禁止（push core） | 任意 target/argv、force、upstream/config 改写、非交互 mutation                                        |

Push Git 子进程采用 argv vector、explicit cwd、`GIT_TERMINAL_PROMPT=0`、超时/输出限制和脱敏 diagnostics；外部副作用不由插件 sandbox 或回滚。
