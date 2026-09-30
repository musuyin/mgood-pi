import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

/** Fixed local-only workflow root. It is intentionally not repository documentation. */
export const WORK_PLANS_ROOT = path.join("tmp", "work-plans");
export const PLAN_FILE = "PLAN.md";
export const REVIEW_FILE = "REVIEW.md";

export type PlanStatus = "draft" | "active" | "completed" | "abandoned";
export type TaskStatus = "completed" | "running" | "blocked" | "not_started";

export interface PlanTask {
  readonly title: string;
  readonly status: TaskStatus;
}

export interface LocalPlanSummary {
  readonly id: string;
  readonly title: string;
  readonly status: PlanStatus;
  readonly language: string;
  readonly directory: string;
  readonly planPath: string;
  readonly reviewPath?: string;
  readonly tasks: readonly PlanTask[];
}

type Frontmatter = Readonly<Record<string, string>>;

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/u);
  if (!match) return {};
  return Object.fromEntries(
    match[1]!
      .split("\n")
      .map((line) => line.match(/^([^:#][^:]*):\s*(.*)$/u))
      .filter((entry): entry is RegExpMatchArray => entry !== null)
      .map((entry) => [entry[1]!.trim(), entry[2]!.trim().replace(/^"|"$/gu, "")]),
  );
}

function asStatus(value: string | undefined): PlanStatus {
  return value === "draft" || value === "active" || value === "completed" || value === "abandoned"
    ? value
    : "draft";
}

function parseTasks(content: string): readonly PlanTask[] {
  return [...content.matchAll(/^\s*- \[([ x>!])\]\s+(.+)$/gmu)].map((match) => ({
    status:
      match[1] === "x"
        ? "completed"
        : match[1] === ">"
          ? "running"
          : match[1] === "!"
            ? "blocked"
            : "not_started",
    title: match[2]!.trim(),
  }));
}

async function readableFile(filePath: string): Promise<string | null> {
  try {
    const details = await stat(filePath);
    return details.isFile() ? await readFile(filePath, "utf8") : null;
  } catch {
    return null;
  }
}

async function rootRealpath(repositoryRoot: string): Promise<string | null> {
  try {
    return await realpath(path.join(repositoryRoot, WORK_PLANS_ROOT));
  } catch {
    return null;
  }
}

async function containedDirectory(
  repositoryRoot: string,
  candidate: string,
): Promise<string | null> {
  const root = await rootRealpath(repositoryRoot);
  if (!root) return null;
  try {
    const resolved = await realpath(candidate);
    const details = await stat(resolved);
    return details.isDirectory() && (resolved === root || resolved.startsWith(`${root}${path.sep}`))
      ? resolved
      : null;
  } catch {
    return null;
  }
}

export async function loadPlan(
  repositoryRoot: string,
  directory: string,
): Promise<LocalPlanSummary | null> {
  const contained = await containedDirectory(repositoryRoot, directory);
  if (!contained) return null;
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  const content = await readableFile(path.join(contained, PLAN_FILE));
  if (!content) return null;
  const metadata = parseFrontmatter(content);
  if (metadata.schemaVersion !== "5" || !metadata.feature_id) return null;
  const reviewFile = path.join(contained, REVIEW_FILE);
  const reviewPath = (await readableFile(reviewFile))
    ? path.relative(canonicalRepositoryRoot, reviewFile)
    : undefined;
  return {
    id: metadata.feature_id,
    title: metadata.title ?? metadata.feature_id,
    status: asStatus(metadata.status),
    language: metadata.language ?? "unknown",
    directory: path.relative(canonicalRepositoryRoot, contained),
    planPath: path.relative(canonicalRepositoryRoot, path.join(contained, PLAN_FILE)),
    ...(reviewPath ? { reviewPath } : {}),
    tasks: parseTasks(content),
  };
}

export async function discoverPlans(repositoryRoot: string): Promise<readonly LocalPlanSummary[]> {
  const root = await rootRealpath(repositoryRoot);
  if (!root) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const plans = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => loadPlan(repositoryRoot, path.join(root, entry.name))),
  );
  return plans.filter((plan): plan is LocalPlanSummary => plan !== null);
}

export function taskCounts(plan: LocalPlanSummary): Readonly<Record<TaskStatus, number>> {
  const counts: Record<TaskStatus, number> = {
    completed: 0,
    running: 0,
    blocked: 0,
    not_started: 0,
  };
  for (const task of plan.tasks) counts[task.status] += 1;
  return counts;
}

export function taskStatusIcon(status: TaskStatus): string {
  return { completed: "✓", running: "▶", blocked: "!", not_started: "○" }[status];
}
