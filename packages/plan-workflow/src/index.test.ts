import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  PLAN_FILE,
  REVIEW_FILE,
  WORK_PLANS_ROOT,
  discoverPlans,
  loadPlan,
  taskCounts,
  taskStatusIcon,
} from "./index.js";

async function repository(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "mgood-plan-lite-"));
}

async function write(root: string, relative: string, content: string): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function plan(root: string, id = "example"): Promise<void> {
  await write(
    root,
    `${WORK_PLANS_ROOT}/${id}/${PLAN_FILE}`,
    "---\ntitle: Example plan\nfeature_id: example\nschemaVersion: 5\nstatus: active\nlanguage: en\n---\n# Plan\n- [x] Finished\n- [>] In progress\n- [!] Blocked\n- [ ] Next\n",
  );
  await write(root, `${WORK_PLANS_ROOT}/${id}/${REVIEW_FILE}`, "# Review\n");
}

describe("local Plan Workflow discovery", () => {
  it("uses only the fixed tmp/work-plans root and two canonical files", () => {
    expect(WORK_PLANS_ROOT).toBe(path.join("tmp", "work-plans"));
    expect(PLAN_FILE).toBe("PLAN.md");
    expect(REVIEW_FILE).toBe("REVIEW.md");
  });

  it("discovers a local Plan and its checklist summary", async () => {
    const root = await repository();
    await plan(root);
    const plans = await discoverPlans(root);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.directory).toBe(path.join(WORK_PLANS_ROOT, "example"));
    expect(plans[0]?.reviewPath).toBe(path.join(WORK_PLANS_ROOT, "example", REVIEW_FILE));
    expect(taskCounts(plans[0]!)).toEqual({ completed: 1, running: 1, blocked: 1, not_started: 1 });
    expect(taskStatusIcon("running")).toBe("▶");
  });

  it("ignores the old repository work-plans root and invalid local directories", async () => {
    const root = await repository();
    await write(
      root,
      "work-plans/legacy/PLAN.md",
      "---\nschemaVersion: 5\nfeature_id: legacy\n---\n",
    );
    await write(root, `${WORK_PLANS_ROOT}/invalid/${PLAN_FILE}`, "# no frontmatter\n");
    expect(await discoverPlans(root)).toEqual([]);
  });

  it("rejects manual paths outside the root and symlink escapes", async () => {
    const root = await repository();
    await plan(root);
    const external = await repository();
    await plan(external, "outside");
    await symlink(
      path.join(external, WORK_PLANS_ROOT, "outside"),
      path.join(root, WORK_PLANS_ROOT, "escape"),
    );
    expect(await loadPlan(root, path.join(root, "work-plans", "legacy"))).toBeNull();
    expect(await loadPlan(root, path.join(root, WORK_PLANS_ROOT, "escape"))).toBeNull();
  });
});
