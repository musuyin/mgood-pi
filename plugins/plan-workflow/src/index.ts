import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import {
  discoverPlans,
  loadPlan,
  taskCounts,
  type LocalPlanSummary,
} from "@mgood-pi/plan-workflow-core";

const PROMPTS = {
  plan: "create-work-plan.md",
  execute: "execute-work-plan.md",
  review: "review-implementation.md",
} as const;
const PROMPT_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prompts");
const COMMAND = "mgood:plan";
type Prompt = keyof typeof PROMPTS;

function notify(
  ctx: ExtensionCommandContext,
  message: string,
  level: "info" | "warning" | "error" = "info",
): void {
  if (ctx.hasUI) ctx.ui.notify(message, level);
  else (level === "error" ? console.error : console.log)(message);
}

function relative(value: string): boolean {
  const normalized = path.normalize(value);
  return !path.isAbsolute(value) && normalized !== ".." && !normalized.startsWith(`..${path.sep}`);
}

function label(plan: LocalPlanSummary): string {
  const counts = taskCounts(plan);
  return `${plan.title} · ${plan.status} · ✓${counts.completed} ▶${counts.running} !${counts.blocked} ○${counts.not_started}`;
}

async function dispatch(pi: ExtensionAPI, operation: Prompt, target: string): Promise<void> {
  const source = await readFile(path.join(PROMPT_DIRECTORY, PROMPTS[operation]), "utf8");
  pi.sendMessage(
    {
      customType: "mgood-plan-workflow",
      content: source.replace(/^---\n[\s\S]*?\n---\n?/u, "").replace(/\$@/gu, target),
      display: false,
      details: { operation, target },
    },
    { triggerTurn: true },
  );
}

function ready(ctx: ExtensionCommandContext): boolean {
  if (!ctx.hasUI || ctx.mode !== "tui") {
    console.error("Interactive /mgood:plan requires TUI mode and performs no write.");
    return false;
  }
  if (!ctx.isIdle()) {
    notify(ctx, "Agent is busy.", "warning");
    return false;
  }
  return true;
}

async function readPlan(ctx: ExtensionCommandContext, plan: LocalPlanSummary): Promise<void> {
  notify(
    ctx,
    `Plan\n${plan.planPath}\n\n${await readFile(path.resolve(ctx.cwd, plan.planPath), "utf8")}`,
  );
}

async function choosePlan(ctx: ExtensionCommandContext): Promise<LocalPlanSummary | null> {
  const plans = await discoverPlans(ctx.cwd);
  if (!plans.length) return null;
  const labels = plans.map(label);
  const selected = await ctx.ui.select("Select local plan", labels);
  return selected ? (plans[labels.indexOf(selected)] ?? null) : null;
}

async function actOnPlan(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  plan: LocalPlanSummary,
): Promise<void> {
  const action = await ctx.ui.select("Plan", [
    "Read plan",
    "Continue implementation",
    "Update plan",
    "Run acceptance review",
    "Discard local plan",
  ]);
  if (action === "Read plan") return readPlan(ctx, plan);
  if (action === "Continue implementation") return dispatch(pi, "execute", plan.directory);
  if (action === "Update plan") {
    const update = await ctx.ui.input("Plan adjustment");
    if (update?.trim()) await dispatch(pi, "plan", `update=${plan.directory} ${update.trim()}`);
    return;
  }
  if (action === "Run acceptance review") return dispatch(pi, "review", plan.directory);
  if (action === "Discard local plan") {
    const confirmed = await ctx.ui.confirm(
      "Discard local plan?",
      `Delete ${plan.directory}. This only deletes local tmp workflow files.`,
    );
    if (confirmed) {
      await rm(path.resolve(ctx.cwd, plan.directory), { recursive: true, force: false });
      notify(ctx, "Local plan discarded");
    }
  }
}

export default function registerPlanWorkflow(pi: ExtensionAPI): void {
  let registered = false;
  pi.on("session_start", () => {
    if (registered) return;
    const collision = pi.getCommands().find((entry) => entry.name === COMMAND);
    if (collision) {
      console.error(`Plan Workflow did not register /${COMMAND}; command already exists.`);
      return;
    }
    pi.registerCommand(COMMAND, {
      description: "Create, continue, update, read, or review a local plan",
      handler: async (args, ctx) => {
        if (!ready(ctx)) return;
        const value = args.trim();
        if (value && relative(value)) {
          const existing = await loadPlan(ctx.cwd, path.resolve(ctx.cwd, value));
          if (existing) return actOnPlan(pi, ctx, existing);
        }
        if (value) return dispatch(pi, "plan", `new ${value}`);
        const selected = await choosePlan(ctx);
        if (selected) return actOnPlan(pi, ctx, selected);
        const request = await ctx.ui.input("Feature request");
        if (request?.trim()) await dispatch(pi, "plan", `new ${request.trim()}`);
      },
    });
    registered = true;
  });
}
