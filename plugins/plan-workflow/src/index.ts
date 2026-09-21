import path from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import {
  discoverPlans,
  loadPlan,
  taskCounts,
  taskStatusIcon,
  type PlanPhase,
  type PlanSummary,
  type PlanTask,
} from "@mgood-pi/plan-workflow-core";

const EXECUTE_PROMPT = "execute-plan";

function statusLabel(status: PlanTask["status"]): string {
  return {
    completed: "completed / 已完成",
    running: "running / 进行中",
    blocked: "blocked / 已阻塞",
    not_started: "not started / 未开始",
  }[status];
}

function planLabel(plan: PlanSummary): string {
  const counts = taskCounts(plan);
  return `${plan.title}  [✓${counts.completed} ▶${counts.running} !${counts.blocked} ○${counts.not_started}]  ${plan.directory}`;
}

function phaseLabel(phase: PlanPhase): string {
  const completed = phase.tasks.filter((task) => task.status === "completed").length;
  return `${phase.title}  [${completed}/${phase.tasks.length}]  ${phase.id}`;
}

function taskLabel(task: PlanTask): string {
  return `${taskStatusIcon(task.status)} ${task.id} — ${task.title}  (${statusLabel(task.status)})`;
}

function parsePlanArgument(args: string): string | null {
  const trimmed = args.trim();
  if (!trimmed) return null;
  const quoted = trimmed.match(/^(["'])(.*?)\1(?:\s|$)/u);
  return quoted?.[2] ?? trimmed.split(/\s+/u)[0] ?? null;
}

async function choosePlan(args: string, ctx: ExtensionCommandContext): Promise<PlanSummary | null> {
  const planArgument = parsePlanArgument(args);
  if (planArgument) {
    const plan = await loadPlan(ctx.cwd, path.resolve(ctx.cwd, planArgument));
    if (!plan) ctx.ui.notify(`Invalid plan / 无效计划: ${planArgument}`, "error");
    return plan;
  }

  const plans = await discoverPlans(ctx.cwd);
  if (plans.length === 0) {
    ctx.ui.notify("No plans found in docs/plans or tmp/plans / 未找到计划", "warning");
    return null;
  }

  const labels = plans.map(planLabel);
  const selected = await ctx.ui.select("Select plan / 选择计划", labels);
  const index = selected ? labels.indexOf(selected) : -1;
  return index >= 0 ? (plans[index] ?? null) : null;
}

async function choosePhase(
  plan: PlanSummary,
  ctx: ExtensionCommandContext,
): Promise<PlanPhase | null> {
  if (plan.phases.length === 1) return plan.phases[0] ?? null;
  const labels = plan.phases.map(phaseLabel);
  const selected = await ctx.ui.select("Select phase / 选择阶段", labels);
  const index = selected ? labels.indexOf(selected) : -1;
  return index >= 0 ? (plan.phases[index] ?? null) : null;
}

async function chooseTask(
  phase: PlanPhase,
  ctx: ExtensionCommandContext,
): Promise<PlanTask | null> {
  if (phase.tasks.length === 0) {
    ctx.ui.notify("This phase has no tasks / 此阶段没有任务", "warning");
    return null;
  }

  const ordered = [...phase.tasks].sort((left, right) => {
    const order: Record<PlanTask["status"], number> = {
      running: 0,
      not_started: 1,
      blocked: 2,
      completed: 3,
    };
    return order[left.status] - order[right.status];
  });
  const labels = ordered.map(taskLabel);
  const selected = await ctx.ui.select("Select task / 选择任务", labels);
  const index = selected ? labels.indexOf(selected) : -1;
  return index >= 0 ? (ordered[index] ?? null) : null;
}

export default function registerPlanWorkflow(pi: ExtensionAPI): void {
  let registered = false;

  pi.on("session_start", () => {
    if (registered) return;
    const collision = pi.getCommands().find((command) => command.name === "do-plan");
    if (collision) {
      console.error(
        `Cannot register /do-plan: command already provided by ${collision.sourceInfo.path ?? collision.source}. Disable the legacy do-plan prompt/package first.`,
      );
      return;
    }

    pi.registerCommand("do-plan", {
      description: "Interactively select and execute one plan task / 交互选择并执行一个计划任务",
      handler: async (args, ctx) => {
        if (!ctx.hasUI) {
          console.error(
            "Interactive /do-plan requires TUI mode. Use /execute-plan <plan-directory> <task-id> in non-interactive mode.",
          );
          return;
        }
        if (!ctx.isIdle()) {
          ctx.ui.notify("Agent is busy / Agent 正在运行", "warning");
          return;
        }

        const plan = await choosePlan(args, ctx);
        if (!plan) return;
        const phase = await choosePhase(plan, ctx);
        if (!phase) return;
        const task = await chooseTask(phase, ctx);
        if (!task) return;

        if (task.status === "completed") {
          ctx.ui.notify(
            "Completed task cannot be executed again / 已完成任务不能重复执行",
            "warning",
          );
          return;
        }
        if (task.status === "blocked") {
          ctx.ui.notify(
            "Resolve or re-plan this blocked task first / 请先解除阻塞或重新规划",
            "warning",
          );
          return;
        }

        pi.sendUserMessage(`/${EXECUTE_PROMPT} ${plan.directory} ${task.id}`, {
          expandPromptTemplates: true,
        });
      },
    });
    registered = true;
  });
}
