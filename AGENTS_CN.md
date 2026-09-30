# mgood-pi Plugin Kit — Agent 指令（中文同步版）

> **权威契约：**Pi 会自动发现英文版 `AGENTS.md`，它是唯一的权威指令文件。`AGENTS_CN.md` 是必须与之同步的中文版本。除非某个 package 确实需要更窄且已文档化的覆盖规则，否则不要创建相互竞争的 `agent.md`、`CLAUDE.md` 或嵌套指令文件。
>
> **同步规则：**修改本文件时，必须在同一 commit 中同步修改 `AGENTS.md`，并保持语义等价。若翻译存在歧义，以英文规则为准，并在合并前消除歧义。

## 1. 使命与边界

构建一组可组合、可独立安装的插件，以改善 **Pi coding-agent 体验**；在保持 Pi extension-first 理念的前提下，尽量接近 Claude Code 和 Codex 的易用性。

### 范围内

- TUI 体验：状态栏/页脚/widgets、交互式对话框、编辑器与命令能力、主题、键盘工作流、无障碍与可发现性。
- 受策展的 Plugin Market：发现经批准的 `mgood-pi` package，展示来源/版本/能力，并且只在用户明确确认后调用 Pi 支持的安装器。
- Skillset 生命周期：发现、校验、profile、安装/更新流程、依赖与信任可见性。
- MCP 集成：连接生命周期、工具/资源暴露、配置 UX、健康检查与权限边界。
- Git 工作流：worktree/session 感知、检查点、安全的 review/commit/restore 流程与仓库状态 UI。
- 持久化项目/用户记忆：显式长期笔记、元数据存储、检索工具、可选本地 RAG 索引、导入/导出与用户控制。
- 可复用的 prompt 工作流，包括 Plan Workflow 仅 TUI 的 `/mgood:plan` 本地计划、实施和验收体验。

### 明确不在范围内

- Context-window compact、摘要策略、prompt history 裁剪或其他上下文管理插件。
- Fork/替换 Pi 内部实现，或底层 runtime/性能优化。
- 静默收集、传输或索引源码及记忆数据。
- 未展示可验证来源且未经用户明确批准，即安装任意第三方 package、skill、MCP server 或 plugin。

若提议的功能跨越范围外边界，应停止实现，改为记录接口/假设。

## 2. 平台假设

- Pi 自动加载 `AGENTS.md`；以它作为仓库指令契约。
- Pi extension 是 TypeScript 模块，可作为 npm/git Pi package 分发。
- Pi package 以本地用户权限执行。所有配置、MCP server、skill、记忆来源和可安装 package，都必须在被明确接受前视为不可信。
- 优先使用 Pi 公共 API、extension events、commands、custom tools、package manifests 与 `@earendil-works/pi-tui`。不要依赖未文档化内部实现，也不要 patch Pi 本身。
- Pi package 安装是 CLI 能力（`pi install`；项目范围使用可选 `-l`），不是进程内 extension API。extension 如要调用 CLI，只能使用直接参数数组，绝不可执行 shell 命令。

## 3. 技术决策

### 默认语言：TypeScript

所有 extension 相关代码、CLI、package manifest、测试、schema 和共享库都使用 **TypeScript（Node.js LTS）**。

必要基线：

- ESM（`"type": "module"`）、严格 TypeScript（`"strict": true`）和明确的公共类型。
- 工具/配置 schema 使用 `typebox`（或仓库统一批准的单一等价方案）；在磁盘、MCP、用户输入边界进行运行时校验。
- Node 内置模块使用 `node:` specifier；最小化 runtime dependency。
- Runtime dependency 必须放入 `dependencies`，不能只放在 `devDependencies`，因为 Pi package 安装使用 production install。
- 使用 npm workspaces 并提交 `package-lock.json`。未经 ADR 不得引入其他 package manager。

### Go 例外

仅当 TypeScript 无法合理满足要求时，才可使用 Go 编写独立可构建的 helper process。它必须有小而版本化的 CLI/JSON-RPC 边界、保持可选、不阻塞基础 Pi 启动、位于 `services/<name>/` 并具备独立 module/测试/release/安全文档，且创建前必须经 ADR 批准。

不要为了重写 TypeScript glue 而编写 Go Pi extension。

## 4. 当前仓库架构

这是一个 TypeScript npm-workspaces monorepo。架构变更时，必须同步更新面向用户的文档以准确反映下列布局。

```text
.
├── AGENTS.md                         # 权威英文 agent 契约
├── AGENTS_CN.md                      # 必须同步的中文契约
├── README.md                          # 面向用户的安装与兼容性指南
├── package.json / package-lock.json   # private workspace 根与 lockfile
├── packages/
│   ├── core/                          # 共享、框架无关的契约
│   └── plan-workflow/                 # Schema v5 本地 PLAN/REVIEW 发现
├── plugins/
│   ├── market/                        # /mgood:market 与 /mgood:init
│   └── plan-workflow/                 # /mgood:plan；私有内置本地计划指引
├── docs/
│   ├── adr/                           # 架构决策记录
│   ├── features/                      # 已实现功能的持续维护文档
│   └── releasing.md                   # 独立 npm 发布流程
├── tmp/work-plans/                    # 用户管理的本地 Schema v5 PLAN/REVIEW 临时数据
├── .changeset/                        # 独立 package 发布意图
└── .github/workflows/release.yml      # 校验、Version Packages PR 与发布
```

Plan Workflow 只从 `tmp/work-plans/` 发现本地工作流数据。不得添加品牌化别名、可配置 root、递归搜索，或兼容扫描仓库根目录 `work-plans/`。

仅当第一个真实 package 或已文档化职责出现时才添加目录。将来的 `packages/ui`、`packages/skillset`、`packages/mcp`、`packages/git`、`packages/memory`、相应 plugins、`skills/`、`prompts/`、`themes/`、`services/`、`examples/` 与 `scripts/` 遵循同样边界。

### Package 与 plugin 规则

- `packages/*` 是可复用库：不得注册 Pi extension，也不得有环境副作用。
- `plugins/*` 是轻量 Pi adapter。每个 plugin 只负责一项内聚的用户能力，并从 `src/index.ts` 导出 extension entrypoint。
- plugin 可依赖 `packages/*`；package 永远不得依赖 plugin。
- 避免 god-plugin。优先提供可独立安装的 feature package，以及可选的 curated bundle/meta-package。
- 每个可分发 package 必须按需具备明确的 `pi` manifest、license、Pi/Node 支持版本、README、changelog、发布文件 allowlist 和公开 npm metadata。
- 除非明确预留短名称，否则使用带命名空间的命令。当前命令包括 `/mgood:init`、`/mgood:market` 和 `/mgood:plan`。不得覆盖 Pi 内建命令。
- Extension factory 不得启动 timer、watcher、process 或 network connection。应在 `session_start` 或懒加载时启动 session 范围资源，并在幂等的 `session_shutdown` handler 中关闭。

### Plugin Market 契约

- `plugins/market` 发布为 `@mgood-pi/plugin-market`。目录名称与 npm package 名称可在必要时不同，但默认应保持对齐以提高可发现性。
- `/mgood:market` 使用代码中维护的、经过策展且版本固定的 catalog。默认不得获取或安装任意 package spec。
- 安装前必须展示精确 package source、请求的 scope、能力以及将执行的 `pi install` 命令；必须要求明确确认。
- 只提供 Pi 支持的 global 与 project-local scope。项目范围使用 `pi install -l`。
- 使用 `spawn` 或等价方案直接传递参数调用 `pi`；绝不可将用户输入插值到 shell command 中。
- 非交互模式下，只打印 catalog entry 和可复制命令；绝不可自动安装。
- `/mgood:init` 保持只读 bootstrap preview。除非未来单独设计并实现明确确认的写入流程，否则不得写文件。

## 5. 独立发布与拆仓

本仓库是一个 monorepo，但 package 独立版本化/发布。每个可发布 workspace 都有独立 npm version、changelog entry 和由 Changesets 管理的 release lifecycle。

- 每次修改可发布 package，都要添加 changeset，选择所有受影响 package 和正确的 semver bump。
- 普通功能修改不要手动改 package version；由 Changesets 计算 version 与内部依赖范围。
- 对每个被修改的可发布 package，运行 `npm run check` 和 `npm pack --workspace <package> --dry-run`。
- Version Packages PR、npm automation credential 与手工发布 fallback 遵循 `docs/releasing.md`。
- 共享依赖应先于依赖它们的 plugin 发布；仅在 Pi package isolation 确有要求时使用 bundled dependency。

只要 plugin 与 kit 共享 release cadence、support policy、types 或协同 UX，就留在本仓库。只有下列条件至少满足两项时，才拆成独立仓库：独立 audience/branding/maintainer/release cadence；不同 security/dependency policy；native/Go release artifact；稳定 standalone API 与独立价值；或不成比例的安装/供应链成本。拆分前必须编写 ADR、发布版本化契约、保留 integration/compatibility test，并记录迁移方案。

## 6. 功能专属契约

### TUI

- 当 `packages/ui` 存在时，复用共享 UI token/component；不得在 plugin 中到处硬编码颜色/布局假设。
- TUI 行为必须在 `print`、`json`、`rpc` 模式安全降级。交互操作需要以 `ctx.mode` 和 `ctx.hasUI` 保护。
- Command 需要简洁描述、键盘可访问流程、取消处理以及有用的非交互输出/错误。

### Skills 与 MCP

- 未展示 source、version、capability summary 且未经明确批准，不得自动安装、自动启用或执行第三方 skill/MCP server。
- 配置与 secret 分离。尽量从环境变量/keychain 读取 credential；从 log、session entry、diagnostic、export 中脱敏 secret。
- MCP connection 应有生命周期状态（configured、connecting、ready、failed、stopped）、有界 retry/timeout 与清晰 disable path。

### Git

- 默认只读检查。任何写操作（checkout、reset、commit、stash、删除 worktree、push）都需要明确确认，并预览受影响 path/ref。
- 默认不得改写历史、force-push 或删除 branch/worktree。
- 每项变更操作必须支持取消，并尽可能报告可恢复 checkpoint。

### Memory、metadata 与 RAG

- Memory 必须 opt-in 且归用户所有。明确 scope（`project`、`workspace` 或 `user`），并使存储位置可见。
- 从版本化本地 KV/metadata abstraction 开始。vector/RAG retrieval 置于 provider interface 之后；不以 hosted vector database 为基线要求。
- 每条 record 附带 schema version、source/provenance、timestamp、scope、retention 信息。
- 提供 inspect、edit、delete、clear、export、re-index 控制。实际可行时 retrieval 必须展示引用的 memory ID/source。
- 不得把检索到的 memory 隐式注入每个 prompt。检索需要明确的 tool、command 或已文档化的 feature setting。

## 7. 工程与质量规则

- 函数保持聚焦；将 filesystem、Git、MCP、subprocess、storage 副作用隔离在 interface 之后。
- 优先采用带 `AbortSignal` 的 `async` API；agent turn 中将 Pi 的 `ctx.signal` 传入嵌套工作。
- 使用结构化、脱敏的 diagnostic。错误需要说明操作与安全修复方式，但不能暴露敏感值。
- 不依赖真实 TUI/MCP server/Git remote 测试 core behavior。为 schema、command behavior、storage migration、permission gate 添加 contract test。
- 为每个 extension 的 registration 与 lifecycle cleanup 添加 integration test。将手动 TUI verification step 放在 package README。
- 合并前必要检查：format、lint、typecheck、unit/contract test、workspace build、适用时的 Changeset status 与 package pack validation。
- 使用 Conventional Commits（`feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`）。保持变更聚焦；不要将无关 refactor 与 feature behavior 混合。

## 8. 文档与架构决策规则

**文档是架构的一部分，不是后续工作。**每个影响架构的变更，都必须在同一 PR/commit 中更新相关文档。契约文档陈旧或被推迟时，不得将实现标记为完成。

影响架构的变更包括：workspace/package 边界；公开 npm package 名称；command、prompt、tool、configuration 契约；持久化/数据流；security/permission model；外部 process/network behavior；dependency/release model；lifecycle ownership；支持的 compatibility；或仓库范围 convention。

对于每个此类变更，在同一变更中更新所有适用内容：

1. 若改变仓库范围规则、架构或工作流，更新 `AGENTS.md` 与 `AGENTS_CN.md`；二者必须语义同步。
2. 更新 `README.md` 中面向用户的 capability、install command、compatibility、layout 与 security statement。
3. 更新受影响 package 的 README 与 `package.json`：install source、manifest、capability、configuration、permission/data access、非交互行为、failure/recovery、uninstall/cleanup。
4. 更新 `docs/features/<feature>/`：已实现 feature 的 architecture、operation 与 package contract。
5. 发布/versioning 发生变化时，更新 `docs/releasing.md`、`.changeset/`、package changelog 与 CI workflow 文档。
6. 针对重要且长期的决策，新增/更新 `docs/adr/NNNN-title.md`，包含 context、decision、alternatives、consequences、date、status。
7. security boundary 或公共 tool/command/config contract 改变时，更新 `docs/security/` 或 `docs/plugin-contracts/`。

若没有现有文档适用，在 `docs/` 创建最小合适文档，并从相关 README 链接。计划/backlog 文档不能替代实现文档。未实施设计必须与已发布行为清晰分离。

若指令冲突，优先级依次为用户安全、Pi 公共 API 文档、以及范围更窄的已文档化 package contract。

## 9. Agent 执行清单

实现功能前：

1. 确认功能在范围内，并识别其 plugin/package 边界。
2. 阅读相关 Pi 公共文档与既有 package/feature contract。
3. 判断是否需要 ADR、安全 review note、明确 approval UX 或 release changeset。
4. 编码前定义 schema、lifecycle ownership、storage/data flow、非 TUI 行为以及文档更新范围。
5. 实现最小的可组合切片，附带测试与所有必要的同步文档。
6. 运行必要检查与 pack validation；报告改动文件、compatibility/release 影响、手动 verification 与明确延期的工作。
