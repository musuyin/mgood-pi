# 安全审查：安全 Git 命令（v8，实施中）

> 本文对应 Work Plan 008。自动测试和发布候选检查不能关闭真实 Pi TUI/disposable-repository 证据缺口；缺少该环境时必须保持 blocked，不能用 mock 代替。WP002–WP007 的历史结果不由本合同更改。

## 资产与信任边界

| 资产               | v7 保护或限制                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 当前 Agent 会话    | `/mgood:git-commit` 仅在 idle interactive TUI 注入一个 `display: false` 的 `mgood-git-commit` custom context message；不另起 provider/planner 或直接 Git write |
| 当前 worktree 内容 | Prompt 要求只处理 invocation current worktree、检查 staged/mixed，并在不可证明精确 whole-path 安全时停止；这不是技术强制权限边界                               |
| 用户授权           | slash invocation 一次授权执行；没有默认预览或二次确认，不授权 push/rewrite/范围外内容                                                                          |
| commit 历史        | Prompt 要求 hook/drift/失败下停止并诚实报告 partial state；不自动 rollback/retry/replan                                                                        |
| remote/凭据        | push-capable workflow 需一次确认并禁止 protected destination；独立 configured-upstream core 保留 exact-refspec、URL 脱敏和 raw identity fingerprint            |

输入（constraints、filename、status、diff、history、hooks、Git 输出和 Agent output）都不可信。commit Prompt 的参数只作文本，不能成为 shell/Git argv。`display: false` 仅抑制 TUI 渲染：custom message仍进入 LLM context，可能留在本地 Pi session/export，不能称为 secret、已删除或不可导出数据。`packages/git` 只为 push 提供确定性执行安全边界；它不为 Agent commit workflow 声称 candidate、batch、message 或 index-mutation authority。

## 统一 commit-push workflows

`/mgood:git-commit-push [constraints]` 与 `/mgood:git-commit-push-pr [constraints]` 都在 hidden current-Agent Prompt 注入前需要一次 interactive TUI confirmation。前者只授权建立/使用 non-protected feature branch、exact-path commit 和 push 该 branch；后者在成功 push 后额外授权一次 `gh pr create`。若当前分支为 protected branch，read-only preflight 成功后 Agent 必须先检查既有 branch 命名惯例和实现范围，再自行通过 `git switch -c <branch>` 创建并切换有意义、未被使用的 descriptive feature branch，且先于 staging、commit 或 push；不会将 checkout 工作交给用户。没有明确惯例时，名称必须是 `<type>/<short-lowercase-kebab-case-summary>`，例如 `feat/git-commit-workflow`，不能是日期、随机 ID、泛化占位名或不可信 constraints 的拷贝。`main`、`master`、`dev`、`develop`（大小写不敏感）永远不能是 push destination；它们仅可作为 PR base。此限制在两个 Prompt 中均为行为约束；独立 configured-upstream core 仍在 preview 前确定性拒绝这些 destination，但不再由 plugin slash command 调用。GitHub CLI、transport、hooks 和 server policy 仍不在 sandbox 内。

## 主要威胁和缓解

- **Prompt injection、模型偏离或过宽工具权限：** Prompt 明确一次授权、current worktree、精确 paths、禁止 broad/destructive Git；commit 禁止 push，两个 push-capable workflow 则禁止 protected destination，并要求证据不足时停止；但 Pi Agent、bash、hooks 和外部进程仍有本地用户权限。不要把该 Prompt 误称为 sandbox；需要硬 gate 时另行配置 Pi/tool policy。
- **意外包含、混合 index 或跨 worktree 写入：** 仅无 staged path 的 clean index、纯 unstaged/untracked whole-file 候选可尽力分组；这不要求绝对语义证明，却仍要求避开明显无关文件。staged/mixed、operation/scope uncertainty、submodule/nested、明显 secrets/私钥、无法识别或 unsafe/generated content 在 mutation 前使整个 workflow 零 commit 停止。单一路径若需 hunk 才能避免混合，只能保留该路径，不能阻止其他 independently classifiable whole-file groups；自动 hunk staging 仍被禁止。常规项目 PNG 不因 binary 属性停止，按其 exact path、名称、仓库角色和功能关系作为普通项目资源处理；已提交合理 groups 后的 ambiguous remainder 也必须留下而非默认收尾。真实验收必须检验此行为，自动测试不能证明 Agent 一定遵守。
- **参数/argv/path injection：** handler 不执行参数，只把其插入 Prompt 的明示约束位置；Prompt 要求参数不能当 shell/Git arguments。独立 package push core 使用 direct argv 和验证后的 configured upstream/refspec。
- **TOCTOU：** Prompt 要求每次 mutation 前重查 drift 和 staged membership；这是行为协议而非 lock。独立 push core 在 preview 后对 repository/HEAD/branch/upstream/remote identity/refspec 做 fingerprint revalidation。
- **secrets、私钥、生成物和 unsafe repository state：** Prompt 要求 Agent识别而非盲目读取或提交；证据不足时停止。常规项目 PNG 仅因二进制属性不构成风险：Agent 按 exact path、名称、仓库角色及其与功能的关系判断，可与相关项目文件一起 exact-path stage，而无需解析像素。实际处理质量必须由真实 Agent 场景审查。
- **hooks 与中断：** Prompt 要求 hooks 正常运行，failure/cancellation/partial sequence 后停止、保留成功 commit、报告状态且不自动修复。push 中断的 remote 结果可未知，须人工检查。
- **无预览的一键风险：** 成功默认只报告 SHA/message，不列 file list；Prompt 要求静默检查、exact-path staging、自动提交可独立归类 groups 并安全保留不可归类路径。clean-index 尽力分组不是任意混合状态放宽、完整提交保证、自动 hunk staging 或默认 remainder commit。真实 transcript 必须证明 Agent没有先展示计划/要求确认、没有使用 broad command、没有吞没 existing staged/mixed 内容。
- **隐藏消息可见性误解：** `display: false` 不显示在 TUI transcript，却不提供保密、清除、加密或 export exclusion；handler 不向 `details`、notification 或日志复制 Prompt/constraints。真实验收必须分别确认显示隐藏和上下文触发，不能从 TUI 看不见推断无持久化。
- **非交互绕过：** 三个 workflow 在 non-TUI/missing UI/busy/Prompt read/send failure 时零注入；两个 push-capable workflow 还必须先获得 TUI confirmation。没有 approval token、后台 timer/watcher 或 model-callable write tool。
- **push 扩权或凭据泄露：** 两个 push-capable Prompt 都禁止 `main`/`master`/`dev`/`develop` protected destination、force、配置改写、tag/ref delete 和自动重试；独立 core 仍维持 configured-upstream exact refspec/non-force/no-retry、protected rejection、terminal-prompt 禁用和 public URL/errors 脱敏。credential helpers/SSH/transport/server 不可 sandbox。

## 操作限制与未完成验证

单元测试覆盖 command registration、idle/non-TUI/read/send-failure gates、frontmatter/参数注入、三个 custom message 的精确消息形状、无 `sendUserMessage`/delivery queue/second-provider、commit 无 confirmation、两个 push-capable workflow confirmation、Prompt 安静/安全条款，以及独立 package core 的 local-bare drift-safe push。发布候选检查覆盖 TypeScript、lint、workspace build 和 tarball file lists。

仍必须在授权 disposable repository 和真实 Pi TUI 中记录：一次命令的跨目录同功能/同目录不同功能语义 commits、安静成功输出、no-change、staged/mixed safe-stop、drift、hook partial success、窄终端、commit no-auto-push、confirmed feature-branch commit-push、confirmed commit-push-PR，及独立 package core local-bare push。不得在开发 checkout 或 live remote 测试；缺少 TTY/model 或任何 Agent 违约时，该 Work Plan 必须 blocked。
