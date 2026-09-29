import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

export const WORK_PLANS_ROOT = "work-plans";
export const WORK_PLAN_APPROVAL_FILE = "APPROVAL.md";

export type WorkflowStatus =
  "draft" | "approved" | "active" | "blocked" | "completed" | "superseded" | "abandoned";
export type FeatureStatus =
  | "planning"
  | "active"
  | "review_pending"
  | "changes_required"
  | "review_blocked"
  | "accepted"
  | "paused"
  | "abandoned"
  | "superseded";
export type ReviewVerdict = "pending" | "pass" | "pass-with-notes" | "changes-required" | "blocked";
export type TaskStatus = "completed" | "running" | "blocked" | "not_started";

export interface PlanTask {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly sourcePath: string;
}

export interface PlanPhase {
  readonly id: string;
  readonly title: string;
  readonly status: WorkflowStatus;
  readonly directory: string;
  readonly planPath: string;
  readonly tasks: readonly PlanTask[];
}

export interface ReviewSummary {
  readonly id: string;
  readonly title: string;
  readonly verdict: ReviewVerdict;
  readonly directory: string;
  readonly targetWorkPlan: string;
  readonly findingCount: number;
  readonly sourceReview?: string;
}

export interface WorkPlanSummary {
  readonly id: string;
  readonly title: string;
  readonly sequence: number;
  readonly kind: string;
  readonly status: WorkflowStatus;
  readonly reviewStatus: ReviewVerdict;
  readonly language: string;
  readonly directory: string;
  readonly approvalPath: string;
  readonly approvedAt?: string;
  readonly approvalNote?: string;
  /** Repository-relative Plan directory this draft will replace after its approval. */
  readonly supersedes?: string;
  /** Repository-relative Plan directory that replaced this Plan. */
  readonly supersededBy?: string;
  readonly supersededAt?: string;
  readonly supersedeReason?: string;
  readonly featureId: string;
  readonly featureTitle: string;
  readonly sourceReview?: string;
  readonly phases: readonly PlanPhase[];
  readonly reviews: readonly ReviewSummary[];
}

export interface FeatureSummary {
  readonly id: string;
  readonly title: string;
  readonly status: FeatureStatus;
  readonly language: string;
  readonly directory: string;
  readonly currentRequirements?: string;
  readonly currentWorkPlan?: string;
  readonly workPlans: readonly WorkPlanSummary[];
}

const WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  "draft",
  "approved",
  "active",
  "blocked",
  "completed",
  "superseded",
  "abandoned",
]);
const FEATURE_STATUSES = new Set<FeatureStatus>([
  "planning",
  "active",
  "review_pending",
  "changes_required",
  "review_blocked",
  "accepted",
  "paused",
  "abandoned",
  "superseded",
]);
const REVIEW_VERDICTS = new Set<ReviewVerdict>([
  "pending",
  "pass",
  "pass-with-notes",
  "changes-required",
  "blocked",
]);

function parseFrontmatter(content: string): Record<string, string> {
  if (!content.startsWith("---\n")) return {};
  const end = content.indexOf("\n---\n", 4);
  if (end < 0) return {};

  const fields: Record<string, string> = {};
  for (const line of content.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 1 || /^\s/u.test(line)) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key && value) fields[key] = value;
  }
  return fields;
}

function asWorkflowStatus(value: string | undefined): WorkflowStatus {
  return value && WORKFLOW_STATUSES.has(value as WorkflowStatus)
    ? (value as WorkflowStatus)
    : "draft";
}

function asFeatureStatus(value: string | undefined): FeatureStatus {
  return value && FEATURE_STATUSES.has(value as FeatureStatus)
    ? (value as FeatureStatus)
    : "planning";
}

function asReviewVerdict(value: string | undefined): ReviewVerdict {
  return value && REVIEW_VERDICTS.has(value as ReviewVerdict)
    ? (value as ReviewVerdict)
    : "pending";
}

function parseTasks(content: string, sourcePath: string): PlanTask[] {
  const tasks: PlanTask[] = [];
  const taskPattern = /^\s*- \[([ xX~!>])\] \*\*([A-Za-z][A-Za-z0-9_-]*-\d+):\s*(.+?)\*\*\s*$/gm;
  for (const match of content.matchAll(taskPattern)) {
    const marker = match[1] ?? " ";
    const id = match[2];
    const title = match[3];
    if (!id || !title) continue;
    const status: TaskStatus =
      marker.toLowerCase() === "x"
        ? "completed"
        : marker === ">"
          ? "running"
          : marker === "!" || marker === "~"
            ? "blocked"
            : "not_started";
    tasks.push({ id, title, status, sourcePath });
  }
  return tasks;
}

async function isDirectory(candidate: string): Promise<boolean> {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

async function readMarkdown(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function isInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  );
}

async function safeExistingPath(repositoryRoot: string, candidate: string): Promise<string | null> {
  try {
    const repository = await realpath(repositoryRoot);
    const fixedRoot = await realpath(path.join(repository, WORK_PLANS_ROOT));
    const resolved = await realpath(candidate);
    return isInside(repository, fixedRoot) && isInside(fixedRoot, resolved) ? resolved : null;
  } catch {
    return null;
  }
}

async function childDirectories(root: string): Promise<string[]> {
  if (!(await isDirectory(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(root, entry.name));
}

async function loadPhase(
  workPlanDirectory: string,
  phaseDirectory: string,
): Promise<PlanPhase | null> {
  const planPath = path.join(phaseDirectory, "PLAN.md");
  const content = await readMarkdown(planPath);
  if (!content) return null;
  const metadata = parseFrontmatter(content);
  return {
    id: metadata.phase ?? path.basename(phaseDirectory),
    title: metadata.title ?? path.basename(phaseDirectory),
    status: asWorkflowStatus(metadata.status),
    directory: path.relative(workPlanDirectory, phaseDirectory),
    planPath: path.relative(workPlanDirectory, planPath),
    tasks: parseTasks(content, path.relative(workPlanDirectory, planPath)),
  };
}

async function loadReviews(
  repositoryRoot: string,
  workPlanDirectory: string,
  workPlanId: string,
): Promise<ReviewSummary[]> {
  const reviewsRoot = path.join(workPlanDirectory, "reviews");
  if (!(await isDirectory(reviewsRoot))) return [];
  const entries = await readdir(reviewsRoot, { withFileTypes: true });
  const reviews: ReviewSummary[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const filePath = path.join(reviewsRoot, entry.name);
    const content = await readMarkdown(filePath);
    if (!content) continue;
    const metadata = parseFrontmatter(content);
    if (!metadata.review_id || metadata.schemaVersion !== "4") continue;
    reviews.push({
      id: metadata.review_id,
      title: metadata.title ?? metadata.review_id,
      verdict: asReviewVerdict(metadata.verdict),
      directory: path.relative(repositoryRoot, filePath),
      targetWorkPlan: metadata.target_work_plan ?? workPlanId,
      findingCount: [...content.matchAll(/^\s*- id:\s*\S+/gmu)].length,
      ...(metadata.source_review ? { sourceReview: metadata.source_review } : {}),
    });
  }
  return reviews;
}

async function loadWorkPlanFromDirectory(
  repositoryRoot: string,
  feature: { id: string; title: string },
  workPlanDirectory: string,
): Promise<WorkPlanSummary | null> {
  const approvalPath = path.join(workPlanDirectory, WORK_PLAN_APPROVAL_FILE);
  const approval = await readMarkdown(approvalPath);
  if (!approval) return null;
  const metadata = parseFrontmatter(approval);
  if (
    metadata.schemaVersion !== "4" ||
    !metadata.work_plan_id ||
    metadata.feature_id !== feature.id
  ) {
    return null;
  }

  const phasesRoot = path.join(workPlanDirectory, "phases");
  const phases: PlanPhase[] = [];
  for (const candidate of (await childDirectories(phasesRoot)).sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b)),
  )) {
    if (!/^phase-\d+[a-z0-9-]*$/iu.test(path.basename(candidate))) continue;
    const phase = await loadPhase(workPlanDirectory, candidate);
    if (phase) phases.push(phase);
  }
  if (phases.length === 0) return null;

  const sequenceFromName = Number.parseInt(
    path.basename(workPlanDirectory).split("-")[0] ?? "",
    10,
  );
  const sequence = Number.parseInt(metadata.sequence ?? "", 10);
  const id = metadata.work_plan_id;
  return {
    id,
    title: metadata.title ?? id,
    sequence: Number.isSafeInteger(sequence) ? sequence : sequenceFromName,
    kind: metadata.kind ?? "implementation",
    status: asWorkflowStatus(metadata.status),
    reviewStatus: asReviewVerdict(metadata.review_status),
    language: metadata.language ?? "unknown",
    directory: path.relative(repositoryRoot, workPlanDirectory),
    approvalPath: path.relative(repositoryRoot, approvalPath),
    ...(metadata.approved_at && metadata.approved_at !== "null"
      ? { approvedAt: metadata.approved_at }
      : {}),
    ...(metadata.approval_note && metadata.approval_note !== "null"
      ? { approvalNote: metadata.approval_note }
      : {}),
    ...(metadata.supersedes ? { supersedes: metadata.supersedes } : {}),
    ...(metadata.superseded_by ? { supersededBy: metadata.superseded_by } : {}),
    ...(metadata.superseded_at ? { supersededAt: metadata.superseded_at } : {}),
    ...(metadata.supersede_reason ? { supersedeReason: metadata.supersede_reason } : {}),
    featureId: feature.id,
    featureTitle: feature.title,
    ...(metadata.source_review ? { sourceReview: metadata.source_review } : {}),
    phases,
    reviews: await loadReviews(repositoryRoot, workPlanDirectory, id),
  };
}

export async function loadFeature(
  repositoryRoot: string,
  candidate: string,
): Promise<FeatureSummary | null> {
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  const safeDirectory = await safeExistingPath(canonicalRepositoryRoot, candidate);
  if (!safeDirectory || !(await isDirectory(safeDirectory))) return null;
  const readme = await readMarkdown(path.join(safeDirectory, "README.md"));
  if (!readme) return null;
  const metadata = parseFrontmatter(readme);
  if (metadata.schemaVersion !== "4" || !metadata.feature_id) return null;

  const feature = { id: metadata.feature_id, title: metadata.title ?? metadata.feature_id };
  const workPlans: WorkPlanSummary[] = [];
  for (const workPlanDirectory of (
    await childDirectories(path.join(safeDirectory, "work-plans"))
  ).sort((a, b) => path.basename(a).localeCompare(path.basename(b)))) {
    if (!/^\d{3}-[a-z0-9-]+$/u.test(path.basename(workPlanDirectory))) continue;
    const workPlan = await loadWorkPlanFromDirectory(
      canonicalRepositoryRoot,
      feature,
      workPlanDirectory,
    );
    if (workPlan) workPlans.push(workPlan);
  }

  return {
    id: feature.id,
    title: feature.title,
    status: asFeatureStatus(metadata.status),
    language: metadata.language ?? "unknown",
    directory: path.relative(canonicalRepositoryRoot, safeDirectory),
    ...(metadata.current_requirements
      ? { currentRequirements: metadata.current_requirements }
      : {}),
    ...(metadata.current_work_plan ? { currentWorkPlan: metadata.current_work_plan } : {}),
    workPlans,
  };
}

export async function discoverFeatures(repositoryRoot: string): Promise<FeatureSummary[]> {
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  const root = path.resolve(canonicalRepositoryRoot, WORK_PLANS_ROOT);
  const features: FeatureSummary[] = [];
  for (const candidate of await childDirectories(root)) {
    const feature = await loadFeature(canonicalRepositoryRoot, candidate);
    if (feature) features.push(feature);
  }
  return features.sort((left, right) => left.title.localeCompare(right.title));
}

export async function discoverWorkPlans(repositoryRoot: string): Promise<WorkPlanSummary[]> {
  return (await discoverFeatures(repositoryRoot)).flatMap((feature) => feature.workPlans);
}

export async function discoverReviews(repositoryRoot: string): Promise<ReviewSummary[]> {
  return (await discoverWorkPlans(repositoryRoot)).flatMap((workPlan) => workPlan.reviews);
}

export async function loadWorkPlan(
  repositoryRoot: string,
  candidate: string,
): Promise<WorkPlanSummary | null> {
  const safeDirectory = await safeExistingPath(repositoryRoot, candidate);
  if (!safeDirectory || !(await isDirectory(safeDirectory))) return null;
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  const featureDirectory = path.dirname(path.dirname(safeDirectory));
  const feature = await loadFeature(canonicalRepositoryRoot, featureDirectory);
  return (
    feature?.workPlans.find(
      (workPlan) => path.resolve(canonicalRepositoryRoot, workPlan.directory) === safeDirectory,
    ) ?? null
  );
}

export async function loadReview(
  repositoryRoot: string,
  candidate: string,
): Promise<ReviewSummary | null> {
  const safeFile = await safeExistingPath(repositoryRoot, candidate);
  if (!safeFile) return null;
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  return (
    (await discoverReviews(canonicalRepositoryRoot)).find(
      (review) => path.resolve(canonicalRepositoryRoot, review.directory) === safeFile,
    ) ?? null
  );
}

export function taskCounts(workPlan: WorkPlanSummary): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    completed: 0,
    running: 0,
    blocked: 0,
    not_started: 0,
  };
  for (const phase of workPlan.phases) {
    for (const task of phase.tasks) counts[task.status] += 1;
  }
  return counts;
}

export function executionStatus(workPlan: WorkPlanSummary): TaskStatus {
  const counts = taskCounts(workPlan);
  const total = counts.completed + counts.running + counts.blocked + counts.not_started;
  if (total > 0 && counts.completed === total) return "completed";
  if (counts.running > 0) return "running";
  if (counts.blocked > 0) return "blocked";
  return "not_started";
}

export function taskStatusIcon(status: TaskStatus): string {
  return { completed: "✓", running: "▶", blocked: "!", not_started: "○" }[status];
}
