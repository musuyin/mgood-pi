import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import registerPlanWorkflow from "./index.js";

async function createPlan(root: string): Promise<void> {
  const directory = path.join(root, "docs/plans/2026-09-21-example");
  await mkdir(path.join(directory, "phases/phase-1"), { recursive: true });
  await writeFile(
    path.join(directory, "README.md"),
    "---\ntitle: Example\nplan_id: example\nstatus: active\nlanguage: en\n---\n",
  );
  await writeFile(
    path.join(directory, "phases/phase-1/PLAN.md"),
    "---\ntitle: Foundation\nphase: phase-1\nstatus: active\n---\n- [ ] **EX-001: Build it**\n- [x] **EX-002: Done**\n",
  );
}

function startSession(on: ReturnType<typeof vi.fn>): void {
  const handler = on.mock.calls[0]?.[1] as (() => void) | undefined;
  if (!handler) throw new Error("session_start handler was not registered");
  handler();
}

function registeredHandler(registerCommand: ReturnType<typeof vi.fn>) {
  return registerCommand.mock.calls[0]?.[1].handler as (args: string, ctx: never) => Promise<void>;
}

describe("plan workflow plugin", () => {
  it("selects a plan and task, then expands the execution prompt", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createPlan(cwd);
    const registerCommand = vi.fn();
    const sendUserMessage = vi.fn();
    const on = vi.fn();
    registerPlanWorkflow({ registerCommand, sendUserMessage, getCommands: () => [], on } as never);
    startSession(on);
    const select = vi
      .fn()
      .mockResolvedValueOnce("Example  [✓1 ▶0 !0 ○1]  docs/plans/2026-09-21-example")
      .mockResolvedValueOnce("○ EX-001 — Build it  (not started / 未开始)");

    await registeredHandler(registerCommand)("", {
      cwd,
      hasUI: true,
      isIdle: () => true,
      ui: { select, notify: vi.fn() },
    } as never);

    expect(sendUserMessage).toHaveBeenCalledWith(
      "/execute-plan docs/plans/2026-09-21-example EX-001",
      { expandPromptTemplates: true },
    );
  });

  it("does not dispatch a completed task", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createPlan(cwd);
    const registerCommand = vi.fn();
    const sendUserMessage = vi.fn();
    const on = vi.fn();
    registerPlanWorkflow({ registerCommand, sendUserMessage, getCommands: () => [], on } as never);
    startSession(on);
    const notify = vi.fn();
    const select = vi
      .fn()
      .mockResolvedValueOnce("Example  [✓1 ▶0 !0 ○1]  docs/plans/2026-09-21-example")
      .mockResolvedValueOnce("✓ EX-002 — Done  (completed / 已完成)");

    await registeredHandler(registerCommand)("", {
      cwd,
      hasUI: true,
      isIdle: () => true,
      ui: { select, notify },
    } as never);

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("不能重复执行"), "warning");
  });

  it("does not shadow an existing do-plan command", () => {
    const registerCommand = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const on = vi.fn();
    registerPlanWorkflow({
      registerCommand,
      on,
      getCommands: () => [
        { name: "do-plan", source: "prompt", sourceInfo: { path: "/legacy/prompts/do-plan.md" } },
      ],
    } as never);
    startSession(on);

    expect(registerCommand).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("legacy do-plan prompt"));
    error.mockRestore();
  });

  it("fails closed without an interactive UI", async () => {
    const registerCommand = vi.fn();
    const sendUserMessage = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const on = vi.fn();
    registerPlanWorkflow({ registerCommand, sendUserMessage, getCommands: () => [], on } as never);
    startSession(on);

    await registeredHandler(registerCommand)("", { cwd: "/tmp", hasUI: false } as never);

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
