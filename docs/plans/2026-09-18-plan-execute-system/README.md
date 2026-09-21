---
title: Pi Plan & Execute system
plan_id: 2026-09-18-plan-execute-system
schemaVersion: 1
version: 1
revision: 2
status: superseded
created: 2026-09-18
updated: 2026-09-18
superseded_by: ../../features/plan-workflow/README.md
current_requirements: requirements/v1.md
current_implementation: implementation/20260918T000000-v1.md
---

# Pi Plan & Execute system

本目录是最初的自动化 Plan & Execute 扩展提案。当前 MVP 已改为 prompt-template 工作流并实现于 [`packages/plan-workflow`](../../../packages/plan-workflow/README.md)；当前行为文档见 [Plan Workflow feature wiki](../../features/plan-workflow/README.md)。本目录保留为未来升级到自动模型编排扩展时的历史设计参考。

## 当前版本

- [项目背景](./CONTEXT.md)
- [需求基线 v1](./requirements/v1.md)
- [实现计划 v1](./implementation/20260918T000000-v1.md)
- [版本与变更历史](./HISTORY.md)

`README.md` frontmatter 中的 `current_requirements` 与 `current_implementation` 是当前指针。实现时应由宿主原子更新，不能依赖“文件名排序后的最后一个文件”推断当前版本。

## 推荐的计划目录约定

```text
<plan-root>/
└── YYYY-MM-DD-description/
    ├── README.md
    ├── CONTEXT.md
    ├── HISTORY.md
    ├── requirements/
    │   ├── v1.md
    │   └── v2.md
    └── implementation/
        ├── YYYYMMDDTHHMMSS-v1.md
        └── YYYYMMDDTHHMMSS-v2.md
```

- `YYYY-MM-DD-description` 隔离一个需求/功能，日期取首次创建日期，slug 创建后不随标题改变。
- 同一功能的需求基线使用 `requirements/vN.md`。
- 每次新的实现基线使用带创建时间和单调版本号的文件；时间便于浏览，版本号是稳定身份。
- 不删除已开始执行或已被引用的旧版本；使用 frontmatter 状态和 `HISTORY.md` 表达替代关系。

## 存储策略

| 模式            | 默认根目录               | Git 行为                                                      | 适用场景                 |
| --------------- | ------------------------ | ------------------------------------------------------------- | ------------------------ |
| `collaborative` | `docs/plans`             | 建议提交；插件只提示，不自动 `git add`                        | 团队评审、交接、长期审计 |
| `personal`      | `tmp/plans`              | 应被忽略；当前仓库的 `tmp/` 已在 `.gitignore`                 | 个人草稿、短期探索       |
| `custom`        | 用户指定的仓库内相对路径 | 启动时报告 tracked/ignored/untracked，不静默修改 `.gitignore` | 仓库自定义规范           |

若 custom 路径位于仓库外，必须显式启用；所有路径都要规范化并阻止 `..` 逃逸和符号链接越界。计划中不得写入凭据、密钥或未经确认的大段源码。

## 当前实现与未来目标

当前 MVP 由用户通过 `/model` 显式选择模型，然后使用 `/make-plan` 和 `/do-plan`。以下交互属于未来自动化 Extension 方向，并非当前已实现行为。

未来目标的最小输入是用户的一句自然语言需求：

```text
/mgood:plan 为 Pi 增加可恢复的 Plan & Execute 工作流
```

扩展自动加载内置 Planner 角色、只读探索策略、计划模板和输出 schema。推荐工作流：

1. `/mgood:plan <需求>`：选择 Planner 模型，隔离探索，预览并保存计划包。
2. `/mgood:plan-status`：显示当前计划、版本、任务状态和 Git 存储策略。
3. `/mgood:execute`：预览待执行任务和 Coder 模型，经明确确认后逐任务执行。
4. `/mgood:revise <变化>`：分析影响；原地更新草稿或创建新版本。
5. `/mgood:plan-history`：查看版本、替代关系、执行证据和失败记录。

非交互模式不得打开对话框：需要审批时返回可操作错误；只有提供显式确认参数后才允许执行写操作。
