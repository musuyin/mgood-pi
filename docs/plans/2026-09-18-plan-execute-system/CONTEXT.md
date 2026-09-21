---
title: Context and architecture
plan_id: 2026-09-18-plan-execute-system
schemaVersion: 1
version: 1
revision: 1
status: proposed
created: 2026-09-18
updated: 2026-09-18
---

# 背景与推荐架构

## 问题

Pi 已提供扩展、prompt template、模型注册表和 SDK AgentSession，但通用对话仍要求用户反复说明“先规划、保存计划、再交给另一个模型执行”。单一清单也难以同时承担背景说明、需求基线、执行进度和变更审计。

本能力应把这些约定产品化：用户只描述目标，系统自动组织 Planner 与 Coder，并将计划保存为人类可读、可评审、可恢复的 Markdown 计划包。

## 范围

### 本期包含

- 可配置的本地计划根目录和显式 Git 策略。
- Planner/Coder 独立模型选择、角色提示和工具权限。
- 分层、版本化 Markdown 计划包。
- 计划预览、审批、逐任务执行、暂停/恢复和证据记录。
- 部分执行后变更的影响分析及版本迁移。
- TUI 与 print/json/rpc 模式的安全退化。

### 本期不包含

- 上下文压缩、历史摘要或 prompt pruning。
- 自动提交、自动 push、自动改写 `.gitignore`。
- 无审批地运行第三方 agent、技能或 MCP server。
- 并行写代码任务、跨仓库事务或托管计划服务。

## 仓库边界

```text
packages/plan-execute/       # 无 Pi 注册副作用的领域层
  config + schemas
  plan repository + renderer
  version/revision policy
  orchestration ports
  execution state machine
plugins/plan-execute/        # 薄 Pi adapter
  commands + tools
  Planner/Coder AgentSession adapters
  model picker + TUI confirmation
  lifecycle + cancellation
```

不要把领域能力继续堆入 `packages/core`。`packages/core` 只保留真正跨插件共享的少量常量/类型。新插件独立发布，并在 `package.json` 中声明 Pi extension manifest、Node/Pi 兼容范围、README、CHANGELOG 和许可证。

## 组件与数据流

```text
User request
  -> Pi command adapter
  -> config/model resolution
  -> isolated Planner AgentSession (read-only)
  -> structured PlanBundle JSON
  -> TypeBox validation + policy checks
  -> deterministic Markdown renderer
  -> preview + explicit save approval
  -> PlanRepository atomic write

approved current plan
  -> task selector/dependency gate
  -> execution preview + explicit approval
  -> isolated Coder AgentSession (scoped write tools)
  -> structured ExecutionReport
  -> verification gate
  -> checkbox/status + append-only evidence update
```

### Planner

- 默认选取配置的高能力模型，精确模型 ID 由用户配置，而不是在源码中绑定供应商。
- 使用独立 AgentSession，避免主会话上下文污染。
- 默认只开放 `read`、受限 `bash/grep/find` 等只读能力。
- 输出结构化 `PlanBundle`，**不直接写计划文件**；宿主校验后确定性渲染，防止路径注入和格式漂移。
- 信息不足时返回有限的澄清问题；如果可作安全假设，则把假设写入需求文档，避免要求用户输入长提示词。

### Coder

- 默认选取独立配置的低成本模型；Planner 与 Coder 配置不得隐式互相覆盖。
- 每次只接收一个已批准任务、相关需求/背景、前置任务证据和验证命令，不接收无边界的“完成整个项目”。
- 写操作仅在 `/mgood:execute` 明确批准后开始；使用 `AbortSignal`，中止后保留可恢复状态。
- 返回结构化 `ExecutionReport`：结果、变更路径、命令、验证结果、风险和下一步。
- 宿主不能仅凭模型声称成功就勾选任务；必须满足该任务定义的验证门槛。

## 配置草案

项目级配置建议位于 `.pi/plan-execute.json`，用户级配置可提供默认值；项目配置是仓库控制输入，加载前应视为不可信并校验。配置与密钥分离。

```json
{
  "schemaVersion": 1,
  "storage": {
    "mode": "collaborative",
    "root": "docs/plans"
  },
  "models": {
    "planner": "provider/high-capability-model",
    "coder": "provider/economy-coding-model"
  },
  "execution": {
    "requireApproval": true,
    "maxTasksPerRun": 1,
    "dirtyWorktreePolicy": "warn"
  }
}
```

模型解析通过 Pi 的 model registry 完成。模型不存在、无凭据或不在 scoped models 中时，命令应给出诊断并允许用户选择，不得静默回退到昂贵模型或当前主模型。

## 状态模型

计划版本状态：

```text
draft -> approved -> active -> completed
                  \-> superseded
                  \-> abandoned
```

任务状态由 Markdown checkbox 提供可读视图，并用 metadata/evidence 保留机器可验证状态：`pending`、`in_progress`、`blocked`、`completed`、`failed`、`carried_forward`。实现初期可全部保存在 Markdown frontmatter/章节中，暂不引入数据库。

## 安全与可靠性

- 原子写入：同目录临时文件、fsync/rename；多文件发布最后更新 README 当前指针。
- 目录锁或 compare-and-swap revision 防止两个会话覆盖同一计划。
- 所有 YAML/JSON/frontmatter、模型输出和磁盘文件都在边界校验。
- 计划正文展示来源、假设和生成模型，但不保存 token、凭据或完整隐式 system prompt。
- 会话资源在 `session_start` 或首次命令时创建，在 `session_shutdown` 幂等关闭；工厂不得启动 timer/watcher/process/network。
- 首版优先使用 SDK 会话而非 shell 启动 `pi`；若 API 无法提供所需隔离，再通过 ADR 评估子进程方案。
