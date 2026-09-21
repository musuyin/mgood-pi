import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

export type PlanStatus = "draft" | "approved" | "active" | "completed" | "superseded" | "abandoned";
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
  readonly status: PlanStatus;
  readonly directory: string;
  readonly planPath: string;
  readonly tasks: readonly PlanTask[];
}

export interface PlanSummary {
  readonly id: string;
  readonly title: string;
  readonly status: PlanStatus;
  readonly language: string;
  readonly directory: string;
  readonly phases: readonly PlanPhase[];
}

const PLAN_STATUSES = new Set<PlanStatus>([
  "draft",
  "approved",
  "active",
  "completed",
  "superseded",
  "abandoned",
]);

function parseFrontmatter(content: string): Record<string, string> {
  if (!content.startsWith("---\n")) return {};
  const end = content.indexOf("\n---\n", 4);
  if (end < 0) return {};

  const fields: Record<string, string> = {};
  for (const line of content.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key && value) fields[key] = value;
  }
  return fields;
}

function asPlanStatus(value: string | undefined): PlanStatus {
  return value && PLAN_STATUSES.has(value as PlanStatus) ? (value as PlanStatus) : "draft";
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

function isInsideRepository(repositoryRoot: string, candidate: string): boolean {
  const relative = path.relative(repositoryRoot, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  );
}

async function resolveSafePath(repositoryRoot: string, candidate: string): Promise<string | null> {
  try {
    const resolvedRoot = await realpath(repositoryRoot);
    const resolvedCandidate = await realpath(candidate);
    return isInsideRepository(resolvedRoot, resolvedCandidate) ? resolvedCandidate : null;
  } catch {
    return null;
  }
}

async function loadPhase(planDirectory: string, phaseDirectory: string): Promise<PlanPhase | null> {
  const planPath = path.join(phaseDirectory, "PLAN.md");
  const content = await readMarkdown(planPath);
  if (!content) return null;

  const metadata = parseFrontmatter(content);
  const relativeDirectory = path.relative(planDirectory, phaseDirectory);
  return {
    id: metadata.phase ?? path.basename(phaseDirectory),
    title: metadata.title ?? path.basename(phaseDirectory),
    status: asPlanStatus(metadata.status),
    directory: relativeDirectory,
    planPath: path.relative(planDirectory, planPath),
    tasks: parseTasks(content, path.relative(planDirectory, planPath)),
  };
}

async function loadLegacyPhase(planDirectory: string, pointer: string): Promise<PlanPhase | null> {
  if (path.isAbsolute(pointer) || pointer.split(/[\\/]/u).includes("..")) return null;
  const planPath = path.resolve(planDirectory, pointer);
  if (!isInsideRepository(planDirectory, planPath)) return null;
  const content = await readMarkdown(planPath);
  if (!content) return null;
  const metadata = parseFrontmatter(content);

  return {
    id: "legacy",
    title: metadata.title ?? "Implementation",
    status: asPlanStatus(metadata.status),
    directory: path.dirname(pointer),
    planPath: pointer,
    tasks: parseTasks(content, pointer),
  };
}

export async function loadPlan(
  repositoryRoot: string,
  candidate: string,
): Promise<PlanSummary | null> {
  const resolvedRepositoryRoot = await realpath(repositoryRoot).catch(() =>
    path.resolve(repositoryRoot),
  );
  const safeDirectory = await resolveSafePath(resolvedRepositoryRoot, candidate);
  if (!safeDirectory || !(await isDirectory(safeDirectory))) return null;

  const readme = await readMarkdown(path.join(safeDirectory, "README.md"));
  if (!readme) return null;
  const metadata = parseFrontmatter(readme);
  if (!metadata.plan_id) return null;

  const phases: PlanPhase[] = [];
  const phasesRoot = path.join(safeDirectory, "phases");
  if (await isDirectory(phasesRoot)) {
    const entries = await readdir(phasesRoot, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isDirectory() || !/^phase-\d+[a-z0-9-]*$/iu.test(entry.name)) continue;
      const phase = await loadPhase(safeDirectory, path.join(phasesRoot, entry.name));
      if (phase) phases.push(phase);
    }
  }

  if (phases.length === 0 && metadata.current_implementation) {
    const legacy = await loadLegacyPhase(safeDirectory, metadata.current_implementation);
    if (legacy) phases.push(legacy);
  }

  if (phases.length === 0) return null;

  return {
    id: metadata.plan_id,
    title: metadata.title ?? metadata.plan_id,
    status: asPlanStatus(metadata.status),
    language: metadata.language ?? "unknown",
    directory: path.relative(resolvedRepositoryRoot, safeDirectory),
    phases,
  };
}

async function childDirectories(root: string): Promise<string[]> {
  if (!(await isDirectory(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(root, entry.name));
}

export async function discoverPlans(
  repositoryRoot: string,
  roots: readonly string[] = ["docs/plans", "tmp/plans"],
): Promise<PlanSummary[]> {
  const plans: PlanSummary[] = [];
  const seen = new Set<string>();

  for (const root of roots) {
    if (path.isAbsolute(root) || root.split(/[\\/]/u).includes("..")) continue;
    for (const candidate of await childDirectories(path.resolve(repositoryRoot, root))) {
      const plan = await loadPlan(repositoryRoot, candidate);
      if (!plan || seen.has(plan.directory)) continue;
      seen.add(plan.directory);
      plans.push(plan);
    }
  }

  return plans.sort((left, right) => right.directory.localeCompare(left.directory));
}

export function taskCounts(plan: PlanSummary): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    completed: 0,
    running: 0,
    blocked: 0,
    not_started: 0,
  };
  for (const phase of plan.phases) {
    for (const task of phase.tasks) counts[task.status] += 1;
  }
  return counts;
}

export function taskStatusIcon(status: TaskStatus): string {
  return { completed: "✓", running: "▶", blocked: "!", not_started: "○" }[status];
}
