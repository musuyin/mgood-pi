---
title: Plan history
plan_id: 2026-09-18-plan-execute-system
schemaVersion: 1
version: 1
revision: 2
status: active
created: 2026-09-18
updated: 2026-09-18
---

# 版本与变更历史

本文件是人类可读的追加式审计日志。已发布事件不得重写；纠错通过新增 correction 事件完成。具体实现还应使用 revision/hash 检测并发写入。

## 演进规则

### 可以修改当前版本的情况

仅在版本仍为 `draft` 且尚未执行任何任务时，可原地修改措辞、补充说明或重排未批准任务。每次保存仍需增加 revision 并记录事件。

执行开始后，允许在当前实现文件中变化的只有**运行状态**：checkbox、开始/结束时间、执行结果链接、验证证据和阻塞原因。需求、任务目标、依赖、影响范围及验收标准视为冻结。

### 必须创建新版本的情况

满足任一条件即新建需求和/或实现版本：

- 已执行任务受到变化影响。
- 需求范围、关键假设、架构方案或安全边界变化。
- 任务语义、依赖、影响路径、验证或完成标准变化。
- 当前版本已经 `approved`、`active`、`completed` 或 `superseded`。
- 无法证明变化只是非语义的文字修正。

### 废弃与替代

- **`superseded`**：仍要实现同一目标，但由新版本替代。旧文件保留，新版本写 `supersedes`。
- **`abandoned`**：目标被取消且没有继任计划。保留已有执行证据和取消原因。
- 不删除旧版本，不把已执行的旧计划“清零”，不把重大变化伪装成 checkbox 更新。

### 部分执行后的迁移

新版本必须给每个旧任务一个处置：

- `carried_forward`：结果仍有效，引用 commit/diff/验证证据，不自动重跑。
- `revalidate`：实现可能有效，但需增加验证任务。
- `replaced`：新任务替代旧任务。
- `dropped`：不再需要，并说明已产生代码如何保留或回退。

先生成 migration preview，经用户批准后，才原子发布新版本并移动 current 指针。旧版本的状态在同一发布事务中变为 `superseded`。

## 事件

### 2026-09-18 — created

- **Actor:** planner
- **Requirements:** `requirements/v1.md`
- **Implementation:** `implementation/20260918T000000-v1.md`
- **Reason:** 为 Pi 规划高能力 Planner 与低成本 Coder 分离的 Plan & Execute 系统。
- **Decision:** v1 采用分层 Markdown 计划包、显式审批、逐任务执行和“冻结历史 + 新版本迁移”策略。

### 2026-09-18 — superseded by prompt-template MVP

- **Actor:** user/planner
- **Current implementation:** `packages/plan-workflow`
- **Documentation:** `docs/features/plan-workflow/README.md`
- **Reason:** 用户希望保留手动 `/model` 成本控制，并以 `/make-plan`、`/do-plan` 消除重复 prompt；现阶段不需要自动双模型编排。
- **Decision:** 先交付 prompt-only Pi package。原扩展实现清单不执行，保留为未来需要确定性 schema、TUI 选择器、原子写入或自动模型编排时的参考。
