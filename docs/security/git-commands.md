# 安全审查：安全 Git 命令（v8，实施中）

> 本文对应 Work Plan 008。自动测试和发布候选检查不能关闭真实 Pi TUI/disposable-repository 证据缺口；缺少该环境时必须保持 blocked，不能用 mock 代替。WP002–WP007 的历史结果不由本合同更改。

## 资产与信任边界

| 资产               | v7 保护或限制                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 当前 Agent 会话    | `/mgood:git-commit` 仅在 idle interactive TUI 注入一个 `display: false` 的 `mgood-git-commit` custom context message；不另起 provider/planner 或直接 Git write |
| 当前 worktree 内容 | Prompt 要求只处理 invocation current worktree、检查 staged/mixed，并在不可证明精确 whole-path 安全时停止；这不是技术强制权限边界                               |
| 用户授权           | slash invocation 一次授权执行；没有默认预览或二次确认，不授权 push/rewrite/范围外内容                                                                          |
| commit 历史        | Prompt 要求 hook/drift/失败下停止并诚实报告 partial state；不自动 rollback/retry/replan                                                                        |
| remote/凭据        | 独立 push 保持 configured-upstream exact-refspec、一次确认、URL 脱敏和 core 内 raw identity fingerprint                                                        |

输入（constraints、filename、status、diff、history、hooks、Git 输出和 Agent output）都不可信。commit Prompt 的参数只作文本，不能成为 shell/Git argv。`display: false` 仅抑制 TUI 渲染：custom message仍进入 LLM context，可能留在本地 Pi session/export，不能称为 secret、已删除或不可导出数据。`packages/git` 只为 push 提供确定性执行安全边界；它不为 Agent commit workflow 声称 candidate、batch、message 或 index-mutation authority。

## 主要威胁和缓解

- **Prompt injection、模型偏离或过宽工具权限：** Prompt 明确一次授权、current worktree、精确 paths、禁止 broad/destructive Git 和 no-push，并要求证据不足时停止；但 Pi Agent、bash、hooks 和外部进程仍有本地用户权限。不要把该 Prompt 误称为 sandbox；需要硬 gate 时另行配置 Pi/tool policy。
- **意外包含、混合 index 或跨 worktree 写入：** 仅无 staged path 的 clean index、纯 unstaged/untracked whole-file 候选可尽力分组；这不要求绝对语义证明，却仍要求避开明显无关文件。staged/mixed、operation/scope uncertainty、submodule/nested、风险内容与 hunk-required 文件均在 mutation 前零 commit 停止；已提交合理 groups 后的 ambiguous remainder 也必须留下而非默认收尾。真实验收必须检验此行为，自动测试不能证明 Agent 一定遵守。
- **参数/argv/path injection：** handler 不执行参数，只把其插入 Prompt 的明示约束位置；Prompt 要求参数不能当 shell/Git arguments。push 使用 direct argv 和验证后的 configured upstream/refspec。
- **TOCTOU：** Prompt 要求每次 mutation 前重查 drift 和 staged membership；这是行为协议而非 lock。push core 在 preview 后对 repository/HEAD/branch/upstream/remote identity/refspec 做 fingerprint revalidation。
- **secrets、binary、生成物和 unsafe repository state：** Prompt 要求 Agent识别而非盲目读取或提交；证据不足时停止。实际处理质量必须由真实 Agent 场景审查。
- **hooks 与中断：** Prompt 要求 hooks 正常运行，failure/cancellation/partial sequence 后停止、保留成功 commit、报告状态且不自动修复。push 中断的 remote 结果可未知，须人工检查。
- **无预览的一键风险：** 成功默认只报告 SHA/message，不列 file list；Prompt 要求静默检查、exact-path staging 和安全停止。clean-index 尽力分组不是任意混合状态放宽、完整提交保证或默认 remainder commit。真实 transcript 必须证明 Agent没有先展示计划/要求确认、没有使用 broad command、没有吞没 existing staged/mixed 内容。
- **隐藏消息可见性误解：** `display: false` 不显示在 TUI transcript，却不提供保密、清除、加密或 export exclusion；handler 不向 `details`、notification 或日志复制 Prompt/constraints。真实验收必须分别确认显示隐藏和上下文触发，不能从 TUI 看不见推断无持久化。
- **非交互绕过：** commit 在 non-TUI/missing UI/busy/Prompt read/send failure 时零注入；push 非交互失败关闭。没有 approval token、后台 timer/watcher 或 model-callable write tool。
- **push 扩权或凭据泄露：** core 维持 configured-upstream exact refspec/non-force/no-retry，禁用 terminal prompt，并脱敏 public URL/errors；credential helpers/SSH/transport/server 不可 sandbox。

## 操作限制与未完成验证

单元测试覆盖 command registration、idle/non-TUI/read/send-failure gates、frontmatter/参数注入、`mgood-git-commit`/`display: false`/`triggerTurn: true` 的精确消息形状、无 `sendUserMessage`/delivery queue/second-provider/commit confirmation、Prompt 一键/安静/安全条款、push 参数/confirmation 和 local-bare drift-safe push。发布候选检查覆盖 TypeScript、lint、workspace build 和 tarball file lists。

仍必须在授权 disposable repository 和真实 Pi TUI 中记录：一次命令的跨目录同功能/同目录不同功能语义 commits、安静成功输出、no-change、staged/mixed safe-stop、drift、hook partial success、窄终端、no-auto-push，及独立 local-bare push。不得在开发 checkout 或 live remote 测试；缺少 TTY/model 或任何 Agent 违约时，该 Work Plan 必须 blocked。
