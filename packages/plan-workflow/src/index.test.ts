import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  WORK_PLAN_APPROVAL_FILE,
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
} from "./index.js";

async function tempRepository(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "mgood-plan-workflow-"));
}

async function write(repository: string, relativePath: string, content: string): Promise<void> {
  const target = path.join(repository, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function createFeature(repository: string): Promise<void> {
  await write(
    repository,
    `${WORK_PLANS_ROOT}/example/README.md`,
    `---\ntitle: Example feature\nfeature_id: example\nschemaVersion: 4\nstatus: active\nlanguage: en\ncurrent_work_plan: work-plans/001-initial\n---\n`,
  );
  await write(
    repository,
    `${WORK_PLANS_ROOT}/example/work-plans/001-initial/APPROVAL.md`,
    `---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nkind: implementation\nstatus: active\nreview_status: pending\nlanguage: en\n---\n`,
  );
  await write(
    repository,
    `${WORK_PLANS_ROOT}/example/work-plans/001-initial/phases/phase-1-foundation/PLAN.md`,
    `---\ntitle: Foundation\nphase: phase-1-foundation\nstatus: active\n---\n- [x] **EX-001: Finished work**\n- [>] **EX-002: Current work**\n- [!] **EX-003: Blocked work**\n- [ ] **EX-004: Future work**\n`,
  );
  await write(
    repository,
    `${WORK_PLANS_ROOT}/example/work-plans/001-initial/reviews/20260922T100000-review.md`,
    `---\ntitle: Initial review\nreview_id: 20260922T100000-review\nschemaVersion: 4\ntarget_work_plan: 001-initial\nverdict: changes-required\n---\nfindings:\n  - id: REV-001\n  - id: REV-002\n`,
  );
}

describe("schema v4 discovery", () => {
  it("uses the unbranded repository-root work-plans directory and APPROVAL.md entry", () => {
    expect(WORK_PLANS_ROOT).toBe("work-plans");
    expect(WORK_PLAN_APPROVAL_FILE).toBe("APPROVAL.md");
  });

  it("discovers features, work plans, phases, tasks, and reviews from the fixed root", async () => {
    const repository = await tempRepository();
    await createFeature(repository);

    const features = await discoverFeatures(repository);
    const workPlans = await discoverWorkPlans(repository);
    const reviews = await discoverReviews(repository);

    expect(features).toHaveLength(1);
    expect(features[0]?.currentWorkPlan).toBe("work-plans/001-initial");
    expect(workPlans[0]?.featureTitle).toBe("Example feature");
    expect(workPlans[0]?.phases[0]?.tasks.map((task) => task.status)).toEqual([
      "completed",
      "running",
      "blocked",
      "not_started",
    ]);
    expect(taskCounts(workPlans[0]!)).toEqual({
      completed: 1,
      running: 1,
      blocked: 1,
      not_started: 1,
    });
    expect(executionStatus(workPlans[0]!)).toBe("running");
    expect(reviews[0]).toMatchObject({ verdict: "changes-required", findingCount: 2 });
  });

  it("loads explicit feature, work-plan, and review paths", async () => {
    const repository = await tempRepository();
    await createFeature(repository);
    const featurePath = path.join(repository, WORK_PLANS_ROOT, "example");
    const workPlanPath = path.join(featurePath, "work-plans/001-initial");
    const reviewPath = path.join(workPlanPath, "reviews/20260922T100000-review.md");

    expect((await loadFeature(repository, featurePath))?.id).toBe("example");
    expect((await loadWorkPlan(repository, workPlanPath))?.approvalPath).toBe(
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
    );
    expect((await loadReview(repository, reviewPath))?.id).toBe("20260922T100000-review");
  });

  it("ignores old and similarly named roots", async () => {
    const repository = await tempRepository();
    await write(
      repository,
      "docs/plans/old/APPROVAL.md",
      "---\nplan_id: old\nschemaVersion: 2\n---\n",
    );
    await write(
      repository,
      "nested/work-plans/example/README.md",
      "---\nfeature_id: wrong\nschemaVersion: 4\n---\n",
    );

    expect(await discoverFeatures(repository)).toEqual([]);
  });

  it("rejects fixed-root descendants symlinked outside the repository", async () => {
    const repository = await tempRepository();
    const outside = await tempRepository();
    await createFeature(outside);
    await mkdir(path.join(repository, WORK_PLANS_ROOT), { recursive: true });
    await symlink(
      path.join(outside, WORK_PLANS_ROOT, "example"),
      path.join(repository, WORK_PLANS_ROOT, "escaped"),
    );

    expect(
      await loadFeature(repository, path.join(repository, WORK_PLANS_ROOT, "escaped")),
    ).toBeNull();
  });
});

describe("taskStatusIcon", () => {
  it("returns readable status symbols", () => {
    expect(
      ["completed", "running", "blocked", "not_started"].map((status) =>
        taskStatusIcon(status as never),
      ),
    ).toEqual(["✓", "▶", "!", "○"]);
  });
});
