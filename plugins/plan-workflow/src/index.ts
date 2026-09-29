import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import {
  discoverFeatures,
  discoverReviews,
  discoverWorkPlans,
  executionStatus,
  loadFeature,
  loadReview,
  loadWorkPlan,
  taskCounts,
  taskStatusIcon,
  WORK_PLANS_ROOT,
  type FeatureSummary,
  type ReviewSummary,
  type WorkPlanSummary,
} from "@mgood-pi/plan-workflow-core";

const PROMPT_FILES = {
  create: "create-work-plan.md",
  execute: "execute-work-plan.md",
  review: "review-implementation.md",
} as const;
const PROMPT_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prompts");
const ENTER_PATH = "⌨ Enter a path manually / 手动输入路径";
const COMMANDS = {
  make: "mgood:plan-make",
  list: "mgood:plan-list",
  approve: "mgood:plan-approve",
  execute: "mgood:plan-do",
  review: "mgood:plan-review",
} as const;

type InternalPrompt = keyof typeof PROMPT_FILES;

function firstArgument(args: string): string | null {
  const trimmed = args.trim();
  if (!trimmed) return null;
  const quoted = trimmed.match(/^(?:"([^"]+)"|'([^']+)')(?:\s|$)/u);
  return quoted?.[1] ?? quoted?.[2] ?? trimmed.split(/\s+/u)[0] ?? null;
}

function repositoryRelative(requested: string): boolean {
  const normalized = path.normalize(requested);
  return (
    !path.isAbsolute(requested) && normalized !== ".." && !normalized.startsWith(`..${path.sep}`)
  );
}

function workPlanLabel(workPlan: WorkPlanSummary): string {
  const counts = taskCounts(workPlan);
  return `${workPlan.featureTitle} / ${workPlan.title}  ${taskStatusIcon(executionStatus(workPlan))} ${executionStatus(workPlan)} · ${workPlan.status} · review ${workPlan.reviewStatus} · ✓${counts.completed} ▶${counts.running} !${counts.blocked} ○${counts.not_started}`;
}

function executable(workPlan: WorkPlanSummary): boolean {
  return (
    ["approved", "active", "blocked"].includes(workPlan.status) &&
    executionStatus(workPlan) !== "completed"
  );
}

function executionIneligibility(workPlan: WorkPlanSummary): string {
  if (workPlan.status === "draft") {
    return "This Plan is a draft. Run /mgood:plan-list to read it, then /mgood:plan-approve before /mgood:plan-do / 此计划仍是草稿；请先用 plan-list 阅读，再用 plan-approve 批准";
  }
  if (workPlan.status === "completed" || executionStatus(workPlan) === "completed")
    return "This Plan is already completed / 此计划已完成";
  return `This Plan cannot be executed while its status is ${workPlan.status} / 此计划当前状态为 ${workPlan.status}，不可执行`;
}

function notify(
  ctx: ExtensionCommandContext,
  message: string,
  level: "info" | "warning" | "error" = "info",
): void {
  if (ctx.hasUI) ctx.ui.notify(message, level);
  else (level === "error" ? console.error : console.log)(message);
}

async function manualPath(ctx: ExtensionCommandContext, kind: string): Promise<string | null> {
  const value = await ctx.ui.input(
    `${kind} directory under ${WORK_PLANS_ROOT} / 输入固定根目录内目录`,
    `${WORK_PLANS_ROOT}/...`,
  );
  return value?.trim() || null;
}

async function loadRequestedPlan(
  ctx: ExtensionCommandContext,
  requested: string,
): Promise<WorkPlanSummary | null> {
  if (!repositoryRelative(requested)) {
    notify(
      ctx,
      `Plan paths must be repository-relative directories under ${WORK_PLANS_ROOT} / Plan 路径必须是固定根目录下的仓库相对目录`,
      "error",
    );
    return null;
  }
  const workPlan = await loadWorkPlan(ctx.cwd, path.resolve(ctx.cwd, requested));
  if (!workPlan)
    notify(
      ctx,
      `Invalid Schema v4 Plan directory under ${WORK_PLANS_ROOT} / 无效 Schema v4 Plan 目录: ${requested}`,
      "error",
    );
  return workPlan;
}

async function chooseWorkPlan(
  args: string,
  ctx: ExtensionCommandContext,
  purpose: "approve" | "execute" | "review",
): Promise<WorkPlanSummary | null> {
  let requested = firstArgument(args);
  if (!requested) {
    const all = await discoverWorkPlans(ctx.cwd);
    const candidates = all.filter((plan) =>
      purpose === "approve"
        ? plan.status === "draft"
        : purpose === "execute"
          ? executable(plan)
          : plan.status === "completed" && executionStatus(plan) === "completed",
    );
    if (candidates.length === 0) {
      const message =
        purpose === "approve"
          ? "No draft Plans need approval / 没有待批准的草稿计划"
          : purpose === "execute" && all.some((plan) => plan.status === "draft")
            ? "No executable Plans found. Use /mgood:plan-list, then /mgood:plan-approve for draft Plans / 没有可执行计划；请先阅读并批准草稿计划"
            : purpose === "review"
              ? "No completed Plans are ready for review / 没有可审查的已完成计划"
              : "No executable Plans found / 未找到可执行的计划";
      notify(ctx, message, "warning");
      return null;
    }
    const labels = candidates.map(workPlanLabel);
    const selected = await ctx.ui.select(
      `${purpose === "approve" ? "Approve" : purpose === "review" ? "Review" : "Select"} Plan / 选择计划`,
      [...labels, ENTER_PATH],
    );
    if (!selected) return null;
    requested =
      selected === ENTER_PATH
        ? await manualPath(ctx, "Plan")
        : (candidates[labels.indexOf(selected)]?.directory ?? null);
  }
  if (!requested) return null;
  const workPlan = await loadRequestedPlan(ctx, requested);
  if (!workPlan) return null;
  if (purpose === "approve" && workPlan.status !== "draft") {
    notify(
      ctx,
      `Only draft Plans can be approved; this Plan is ${workPlan.status} / 仅草稿计划可批准`,
      "warning",
    );
    return null;
  }
  if (purpose === "execute" && !executable(workPlan)) {
    notify(ctx, executionIneligibility(workPlan), "warning");
    return null;
  }
  if (
    purpose === "review" &&
    !(workPlan.status === "completed" && executionStatus(workPlan) === "completed")
  ) {
    notify(ctx, "Only completed Plans can be reviewed / 仅已完成计划可审查", "warning");
    return null;
  }
  return workPlan;
}

async function chooseFeature(ctx: ExtensionCommandContext): Promise<FeatureSummary | null> {
  const features = await discoverFeatures(ctx.cwd);
  if (!features.length) {
    notify(ctx, "No Features found / 未找到 Feature", "warning");
    return null;
  }
  const labels = features.map(
    (feature) => `${feature.title} · ${feature.status} · ${feature.directory}`,
  );
  const selected = await ctx.ui.select("Select Feature / 选择 Feature", [...labels, ENTER_PATH]);
  if (!selected) return null;
  const requested =
    selected === ENTER_PATH
      ? await manualPath(ctx, "Feature")
      : features[labels.indexOf(selected)]?.directory;
  if (!requested || !repositoryRelative(requested)) {
    notify(
      ctx,
      "Feature path must be a repository-relative directory / Feature 路径必须是仓库相对目录",
      "error",
    );
    return null;
  }
  const feature = await loadFeature(ctx.cwd, path.resolve(ctx.cwd, requested));
  if (!feature)
    notify(
      ctx,
      `Invalid Schema v4 Feature directory / 无效 Schema v4 Feature 目录: ${requested}`,
      "error",
    );
  return feature;
}

function reviewLabel(review: ReviewSummary, plans: readonly WorkPlanSummary[]): string {
  const plan = plans.find((candidate) => candidate.id === review.targetWorkPlan);
  return `${plan ? `${plan.featureTitle} / ${plan.title}` : review.targetWorkPlan} · ${review.verdict} · ${review.findingCount} findings · ${review.id}`;
}

async function chooseReview(ctx: ExtensionCommandContext): Promise<ReviewSummary | null> {
  const plans = await discoverWorkPlans(ctx.cwd);
  const reviews = (await discoverReviews(ctx.cwd)).filter(
    (review) => review.verdict === "changes-required" || review.verdict === "blocked",
  );
  if (!reviews.length) {
    notify(ctx, "No actionable Reviews found / 未找到待处理 Review", "warning");
    return null;
  }
  const labels = reviews.map((review) => reviewLabel(review, plans));
  const selected = await ctx.ui.select("Select Review / 选择 Review", [...labels, ENTER_PATH]);
  if (!selected) return null;
  const requested =
    selected === ENTER_PATH
      ? await manualPath(ctx, "Review")
      : reviews[labels.indexOf(selected)]?.directory;
  if (!requested || !repositoryRelative(requested)) {
    notify(ctx, "Review path must be repository-relative / Review 路径必须是仓库相对路径", "error");
    return null;
  }
  const review = await loadReview(ctx.cwd, path.resolve(ctx.cwd, requested));
  if (!review) notify(ctx, `Invalid Review / 无效 Review: ${requested}`, "error");
  return review;
}

async function send(pi: ExtensionAPI, prompt: InternalPrompt, target: string): Promise<void> {
  const source = await readFile(path.join(PROMPT_DIRECTORY, PROMPT_FILES[prompt]), "utf8");
  pi.sendMessage(
    {
      customType: "mgood-plan-workflow",
      content: source.replace(/^---\n[\s\S]*?\n---\n?/u, "").replace(/\$@/gu, target),
      display: false,
      details: { operation: prompt, target },
    },
    { triggerTurn: true },
  );
}

function listSummary(features: readonly FeatureSummary[]): string {
  if (!features.length) return `No Features found under ${WORK_PLANS_ROOT} / 未找到 Feature`;
  return features
    .map((feature) =>
      [
        `${feature.title} (${feature.id}) · ${feature.status} · ${feature.directory}`,
        ...feature.workPlans.map((plan) => {
          const counts = taskCounts(plan);
          const relationship = plan.supersededBy
            ? ` · superseded by ${path.basename(plan.supersededBy)}`
            : plan.supersedes
              ? ` · replaces ${path.basename(plan.supersedes)} when approved`
              : "";
          return `  ${taskStatusIcon(executionStatus(plan))} ${plan.id} — ${plan.title} · ${plan.status}${relationship} · review ${plan.reviewStatus} · ✓${counts.completed} ▶${counts.running} !${counts.blocked} ○${counts.not_started}`;
        }),
      ].join("\n"),
    )
    .join("\n\n");
}

async function showPlanApproval(
  ctx: ExtensionCommandContext,
  plan: WorkPlanSummary,
): Promise<void> {
  const approval = await readFile(path.resolve(ctx.cwd, plan.approvalPath), "utf8");
  notify(ctx, `Plan details / 计划详情\n${plan.approvalPath}\n\n${approval}`);
}

async function choosePlanToRead(
  ctx: ExtensionCommandContext,
  plans: readonly WorkPlanSummary[],
): Promise<void> {
  if (!plans.length) return;
  const labels = plans.map(workPlanLabel);
  const selected = await ctx.ui.select("Read Plan details / 选择要阅读的计划", [
    ...labels,
    "Keep summary only / 仅查看摘要",
  ]);
  if (!selected || selected === "Keep summary only / 仅查看摘要") return;
  const plan = plans[labels.indexOf(selected)];
  if (plan) await showPlanApproval(ctx, plan);
}

async function handleList(args: string, ctx: ExtensionCommandContext): Promise<void> {
  const requested = firstArgument(args);
  if (!requested) {
    const features = await discoverFeatures(ctx.cwd);
    notify(ctx, listSummary(features));
    if (ctx.hasUI && ctx.mode === "tui")
      await choosePlanToRead(
        ctx,
        features.flatMap((feature) => feature.workPlans),
      );
    return;
  }
  if (!repositoryRelative(requested)) {
    notify(
      ctx,
      `Paths must be repository-relative directories under ${WORK_PLANS_ROOT} / 路径必须是固定根目录下的仓库相对目录`,
      "error",
    );
    return;
  }
  const absolute = path.resolve(ctx.cwd, requested);
  const feature = await loadFeature(ctx.cwd, absolute);
  if (feature) {
    notify(ctx, listSummary([feature]));
    if (ctx.hasUI && ctx.mode === "tui") await choosePlanToRead(ctx, feature.workPlans);
    return;
  }
  const plan = await loadWorkPlan(ctx.cwd, absolute);
  if (!plan) {
    notify(
      ctx,
      `Invalid Schema v4 Feature or Plan directory under ${WORK_PLANS_ROOT} / 无效目录: ${requested}`,
      "error",
    );
    return;
  }
  await showPlanApproval(ctx, plan);
}

function ready(ctx: ExtensionCommandContext, command: string): boolean {
  if (!ctx.hasUI || ctx.mode !== "tui") {
    console.error(`Interactive /${command} requires TUI mode and performs no write.`);
    return false;
  }
  if (!ctx.isIdle()) {
    ctx.ui.notify("Agent is busy / Agent 正在运行", "warning");
    return false;
  }
  return true;
}

function updateFrontmatter(content: string, values: Readonly<Record<string, string>>): string {
  const frontmatterEnd = content.indexOf("\n---\n", 4);
  if (!content.startsWith("---\n") || frontmatterEnd < 0)
    throw new Error("APPROVAL.md has no valid frontmatter");
  const fields = content.slice(4, frontmatterEnd).split("\n");
  for (const [key, value] of Object.entries(values)) {
    const index = fields.findIndex((line) => line.startsWith(`${key}:`));
    if (index >= 0) fields[index] = `${key}: ${value}`;
    else fields.push(`${key}: ${value}`);
  }
  return `---\n${fields.join("\n")}\n---${content.slice(frontmatterEnd + 4)}`;
}

function updateApproval(content: string, approvedAt: string): string {
  return updateFrontmatter(content, {
    status: "approved",
    approved_at: approvedAt,
    approval_note: "null",
    updated: approvedAt,
  });
}

function canBeSuperseded(plan: WorkPlanSummary): boolean {
  return ["draft", "approved", "blocked"].includes(plan.status);
}

async function resolveSupersededPlan(
  ctx: ExtensionCommandContext,
  plan: WorkPlanSummary,
): Promise<WorkPlanSummary | null> {
  if (!plan.supersedes || !repositoryRelative(plan.supersedes)) return null;
  const oldPlan = await loadWorkPlan(ctx.cwd, path.resolve(ctx.cwd, plan.supersedes));
  if (!oldPlan || oldPlan.featureId !== plan.featureId || !canBeSuperseded(oldPlan)) return null;
  return oldPlan;
}

async function updateFeatureCurrentPlan(
  ctx: ExtensionCommandContext,
  featureDirectory: string,
  planDirectory: string,
  updatedAt: string,
): Promise<void> {
  const featurePath = path.resolve(ctx.cwd, featureDirectory, "README.md");
  const feature = await readFile(featurePath, "utf8");
  await writeFile(
    featurePath,
    updateFrontmatter(feature, {
      current_work_plan: path.relative(featureDirectory, planDirectory),
      updated: updatedAt,
    }),
  );
}

async function approvePlan(args: string, ctx: ExtensionCommandContext): Promise<void> {
  if (!ready(ctx, COMMANDS.approve)) return;
  const plan = await chooseWorkPlan(args, ctx, "approve");
  if (!plan) return;
  const approvalPath = path.resolve(ctx.cwd, plan.approvalPath);
  const approval = await readFile(approvalPath, "utf8");
  const supersededPlan = await resolveSupersededPlan(ctx, plan);
  if (plan.supersedes && !supersededPlan) {
    notify(
      ctx,
      "This Plan declares an invalid or ineligible superseded Plan / 此计划声明的被替代计划无效或不可替代",
      "error",
    );
    return;
  }
  await showPlanApproval(ctx, plan);
  const approved = await ctx.ui.confirm(
    "Approve this Plan? / 是否批准此计划？",
    supersededPlan
      ? `Approve ${plan.title}, supersede ${supersededPlan.title}, and allow /mgood:plan-do? / 批准新计划、替代旧计划并允许执行？`
      : `Allow /mgood:plan-do for ${plan.title}? / 是否允许执行此计划？`,
  );
  if (!approved) {
    const note = await ctx.ui.input(
      "Approval feedback / 不批准意见",
      "Explain what must change before approval / 请说明批准前需要修改什么",
    );
    const feedback = note?.trim();
    if (feedback) {
      const feedbackAt = new Date().toISOString();
      const featureDirectory = path.dirname(path.dirname(plan.directory));
      await appendFile(
        path.resolve(ctx.cwd, featureDirectory, "HISTORY.md"),
        `\n- ${feedbackAt} — Plan ${plan.id} not approved — ${feedback}\n`,
      );
      ctx.ui.notify("Plan remains draft; feedback recorded / 计划保持草稿，意见已记录", "info");
    } else {
      ctx.ui.notify("Plan remains draft; no files were changed / 计划保持草稿，未写入文件", "info");
    }
    return;
  }
  const approvedAt = new Date().toISOString();
  const featureDirectory = path.dirname(path.dirname(plan.directory));
  const supersededApproval = supersededPlan
    ? updateFrontmatter(
        await readFile(path.resolve(ctx.cwd, supersededPlan.approvalPath), "utf8"),
        {
          status: "superseded",
          superseded_by: plan.directory,
          superseded_at: approvedAt,
          updated: approvedAt,
        },
      )
    : null;
  const approvedApproval = updateApproval(approval, approvedAt);
  if (supersededPlan && supersededApproval) {
    await writeFile(path.resolve(ctx.cwd, supersededPlan.approvalPath), supersededApproval);
  }
  await writeFile(approvalPath, approvedApproval);
  await updateFeatureCurrentPlan(ctx, featureDirectory, plan.directory, approvedAt);
  const historyDetail = supersededPlan ? `; superseded ${supersededPlan.id}` : "";
  await appendFile(
    path.resolve(ctx.cwd, featureDirectory, "HISTORY.md"),
    `\n- ${approvedAt} — Plan ${plan.id} approved${historyDetail}\n`,
  );
  ctx.ui.notify(`Approved Plan ${plan.id} / 已批准计划 ${plan.id}`, "info");
}

async function handleMakePlan(
  pi: ExtensionAPI,
  args: string,
  ctx: ExtensionCommandContext,
): Promise<void> {
  if (!ready(ctx, COMMANDS.make)) return;
  const trimmed = args.trim();
  if (trimmed) {
    const reviewMatch = trimmed.match(/^review=(?:"([^"]+)"|'([^']+)'|(\S+))$/u);
    if (reviewMatch) {
      const request = reviewMatch[1] ?? reviewMatch[2] ?? reviewMatch[3] ?? "";
      if (!repositoryRelative(request)) {
        notify(
          ctx,
          "Review path must be repository-relative / Review 路径必须是仓库相对路径",
          "error",
        );
        return;
      }
      const review = await loadReview(ctx.cwd, path.resolve(ctx.cwd, request));
      if (!review) {
        notify(ctx, `Invalid Review / 无效 Review: ${request}`, "error");
        return;
      }
      await send(pi, "create", `review=${review.directory}`);
      return;
    }
    const featureMatch = trimmed.match(
      /^feature=(?:"(?<featureDouble>[^"]+)"|'(?<featureSingle>[^']+)'|(?<featureBare>\S+))(?:\s+supersede=(?:"(?<supersedeDouble>[^"]+)"|'(?<supersedeSingle>[^']+)'|(?<supersedeBare>\S+)))?\s+(?<goal>.+)$/u,
    );
    if (featureMatch?.groups) {
      const request =
        featureMatch.groups.featureDouble ??
        featureMatch.groups.featureSingle ??
        featureMatch.groups.featureBare ??
        "";
      const supersedeRequest =
        featureMatch.groups.supersedeDouble ??
        featureMatch.groups.supersedeSingle ??
        featureMatch.groups.supersedeBare ??
        null;
      const goal = featureMatch.groups.goal?.trim() ?? "";
      if (!repositoryRelative(request)) {
        notify(
          ctx,
          "Feature path must be repository-relative / Feature 路径必须是仓库相对路径",
          "error",
        );
        return;
      }
      const feature = await loadFeature(ctx.cwd, path.resolve(ctx.cwd, request));
      if (!feature || !goal) {
        notify(ctx, "Invalid Feature or empty goal / 无效 Feature 或目标为空", "error");
        return;
      }
      let supersede: WorkPlanSummary | null = null;
      if (supersedeRequest) {
        if (!repositoryRelative(supersedeRequest)) {
          notify(
            ctx,
            "Superseded Plan path must be repository-relative / 被替代计划路径必须是仓库相对路径",
            "error",
          );
          return;
        }
        supersede = await loadWorkPlan(ctx.cwd, path.resolve(ctx.cwd, supersedeRequest));
        if (!supersede || supersede.featureId !== feature.id || !canBeSuperseded(supersede)) {
          notify(
            ctx,
            "Invalid or ineligible Plan to supersede / 被替代计划无效或不可替代",
            "error",
          );
          return;
        }
      }
      await send(
        pi,
        "create",
        `feature=${feature.directory}${supersede ? ` supersede=${supersede.directory}` : ""} ${goal}`,
      );
      return;
    }
    await send(pi, "create", `new-feature ${trimmed}`);
    return;
  }
  const actions = [
    "Create a new Feature / 创建新 Feature",
    "Add a Plan to a Feature / 为已有 Feature 新增计划",
    "Create remediation from a Review / 从 Review 创建修复计划",
  ];
  const selected = await ctx.ui.select("Make Plan / 创建计划", actions);
  if (!selected) return;
  if (selected === actions[0]) {
    const request = await ctx.ui.input("Feature request / 功能需求");
    if (request?.trim()) await send(pi, "create", `new-feature ${request.trim()}`);
    return;
  }
  if (selected === actions[1]) {
    const feature = await chooseFeature(ctx);
    if (!feature) return;
    const candidates = feature.workPlans.filter(canBeSuperseded);
    let supersede: WorkPlanSummary | null = null;
    if (candidates.length) {
      const options = [
        "Keep existing Plans / 保持原计划",
        ...candidates.map((plan) => `Supersede: ${workPlanLabel(plan)} / 用新计划替代`),
        "Cancel / 取消",
      ];
      const decision = await ctx.ui.select("Existing unfinished Plans / 已有未结束计划", options);
      if (!decision || decision === "Cancel / 取消") return;
      const offset = options.indexOf(decision) - 1;
      if (offset >= 0) supersede = candidates[offset] ?? null;
    }
    const goal = await ctx.ui.input("Plan goal / 本轮计划目标");
    if (goal?.trim()) {
      const supersedeArgument = supersede ? ` supersede=${supersede.directory}` : "";
      await send(pi, "create", `feature=${feature.directory}${supersedeArgument} ${goal.trim()}`);
    }
    return;
  }
  const review = await chooseReview(ctx);
  if (review) await send(pi, "create", `review=${review.directory}`);
}

export default function registerPlanWorkflow(pi: ExtensionAPI): void {
  let registered = false;
  pi.on("session_start", () => {
    if (registered) return;
    const collision = pi
      .getCommands()
      .find((command) => Object.values(COMMANDS).includes(command.name as never));
    if (collision) {
      console.error(
        `Cannot register /${collision.name}: command already provided by ${collision.sourceInfo.path ?? collision.source}. Disable the legacy command first.`,
      );
      return;
    }
    pi.registerCommand(COMMANDS.make, {
      description: "Create a Feature or Plan / 创建 Feature 或计划",
      handler: (args, ctx) => handleMakePlan(pi, args, ctx),
    });
    pi.registerCommand(COMMANDS.list, {
      description: "Read Feature or Plan status / 只读查看 Feature 或计划状态",
      handler: (args, ctx) => handleList(args, ctx),
    });
    pi.registerCommand(COMMANDS.approve, {
      description: "Explicitly approve a draft Plan / 明确批准草稿计划",
      handler: (args, ctx) => approvePlan(args, ctx),
    });
    pi.registerCommand(COMMANDS.execute, {
      description: "Select and execute one approved Plan / 选择并执行已批准计划",
      handler: async (args, ctx) => {
        if (!ready(ctx, COMMANDS.execute)) return;
        const plan = await chooseWorkPlan(args, ctx, "execute");
        if (!plan) return;
        const counts = taskCounts(plan);
        if (!counts.completed && !counts.running && !counts.blocked && !counts.not_started) {
          notify(ctx, "This Plan has no checklist / 此计划没有清单", "warning");
          return;
        }
        await send(pi, "execute", plan.directory);
      },
    });
    pi.registerCommand(COMMANDS.review, {
      description: "Independently review a completed Plan / 独立审查已完成计划",
      handler: async (args, ctx) => {
        if (!ready(ctx, COMMANDS.review)) return;
        const plan = await chooseWorkPlan(args, ctx, "review");
        if (plan) await send(pi, "review", plan.directory);
      },
    });
    registered = true;
  });
}
