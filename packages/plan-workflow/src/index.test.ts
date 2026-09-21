import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { discoverPlans, loadPlan, taskCounts, taskStatusIcon } from "./index.js";

async function tempRepository(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "mgood-plan-workflow-"));
}

async function write(repository: string, relativePath: string, content: string): Promise<void> {
  const target = path.join(repository, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

const readme = `---
title: Example feature
plan_id: 2026-09-21-example
schemaVersion: 2
version: 1
revision: 1
status: active
language: en
---
`;

const phasePlan = `---
title: Foundation
phase: phase-1
status: active
---
- [x] **EX-001: Finished work**
- [>] **EX-002: Current work**
- [!] **EX-003: Blocked work**
- [ ] **EX-004: Future work**
`;

describe("plan discovery", () => {
  it("discovers v2 phase plans and parses task states", async () => {
    const repository = await tempRepository();
    await write(repository, "docs/plans/2026-09-21-example/README.md", readme);
    await write(repository, "docs/plans/2026-09-21-example/phases/phase-1/PLAN.md", phasePlan);

    const plans = await discoverPlans(repository);

    expect(plans).toHaveLength(1);
    expect(plans[0]?.phases[0]?.tasks.map((task) => task.status)).toEqual([
      "completed",
      "running",
      "blocked",
      "not_started",
    ]);
    expect(taskCounts(plans[0]!)).toEqual({ completed: 1, running: 1, blocked: 1, not_started: 1 });
  });

  it("loads legacy current_implementation plans", async () => {
    const repository = await tempRepository();
    await write(
      repository,
      "docs/plans/legacy/README.md",
      `---\ntitle: Legacy\nplan_id: legacy\nstatus: draft\ncurrent_implementation: implementation/v1.md\n---\n`,
    );
    await write(
      repository,
      "docs/plans/legacy/implementation/v1.md",
      "- [ ] **OLD-001: Legacy task**\n",
    );

    const plan = await loadPlan(repository, path.join(repository, "docs/plans/legacy"));

    expect(plan?.phases[0]?.id).toBe("legacy");
    expect(plan?.phases[0]?.tasks[0]?.id).toBe("OLD-001");
  });

  it("rejects a plan directory symlinked outside the repository", async () => {
    const repository = await tempRepository();
    const outside = await tempRepository();
    await write(outside, "README.md", readme);
    await write(outside, "phases/phase-1/PLAN.md", phasePlan);
    await mkdir(path.join(repository, "docs/plans"), { recursive: true });
    await symlink(outside, path.join(repository, "docs/plans/escaped"));

    expect(await loadPlan(repository, path.join(repository, "docs/plans/escaped"))).toBeNull();
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
