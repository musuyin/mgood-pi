import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import registerPlanWorkflow from "./index.js";

async function write(root: string, relativePath: string, content: string): Promise<void> {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function createFeature(root: string, completed = false): Promise<void> {
  const base = "work-plans/example";
  await write(
    root,
    `${base}/README.md`,
    "---\ntitle: Example Feature\nfeature_id: example\nschemaVersion: 4\nstatus: active\nlanguage: en\n---\n",
  );
  await write(
    root,
    `${base}/work-plans/001-initial/APPROVAL.md`,
    `---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: ${completed ? "completed" : "active"}\nreview_status: pending\nlanguage: en\napproved_at: null\napproval_note: null\n---\n`,
  );
  await write(
    root,
    `${base}/work-plans/001-initial/phases/phase-1/PLAN.md`,
    `---\ntitle: Foundation\nphase: phase-1\nstatus: active\n---\n- [${completed ? "x" : " "}] **EX-001: Build it**\n`,
  );
  await write(
    root,
    `${base}/work-plans/001-initial/reviews/20260922-review.md`,
    "---\ntitle: Review\nreview_id: 20260922-review\nschemaVersion: 4\ntarget_work_plan: 001-initial\nverdict: changes-required\n---\nfindings:\n  - id: REV-001\n",
  );
}

function startSession(on: ReturnType<typeof vi.fn>): void {
  const handler = on.mock.calls[0]?.[1] as (() => void) | undefined;
  if (!handler) throw new Error("session_start handler was not registered");
  handler();
}

function handlers(
  registerCommand: ReturnType<typeof vi.fn>,
): Record<string, (args: string, ctx: never) => Promise<void>> {
  return Object.fromEntries(
    registerCommand.mock.calls.map(([name, definition]) => [name, definition.handler]),
  );
}

function setup() {
  const registerCommand = vi.fn();
  const sendMessage = vi.fn();
  const sendUserMessage = vi.fn();
  const on = vi.fn();
  registerPlanWorkflow({
    registerCommand,
    sendMessage,
    sendUserMessage,
    getCommands: () => [],
    on,
  } as never);
  startSession(on);
  return { registerCommand, sendMessage, sendUserMessage, commands: handlers(registerCommand) };
}

function context(cwd: string, ui: object) {
  return {
    cwd,
    mode: "tui",
    hasUI: true,
    isIdle: () => true,
    ui: { select: vi.fn().mockResolvedValue(undefined), input: vi.fn(), confirm: vi.fn(), ...ui },
  } as never;
}

describe("plan workflow plugin", () => {
  it("registers the five namespaced workflow commands", () => {
    const { registerCommand } = setup();
    expect(registerCommand.mock.calls.map(([name]) => name)).toEqual([
      "mgood:plan-make",
      "mgood:plan-list",
      "mgood:plan-approve",
      "mgood:plan-do",
      "mgood:plan-review",
    ]);
  });

  it("selects one Work Plan and dispatches bundled internal execution guidance", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();
    const select = vi
      .fn()
      .mockResolvedValueOnce(
        "Example Feature / Initial implementation  ○ not_started · active · review pending · ✓0 ▶0 !0 ○1",
      );

    await commands["mgood:plan-do"]!("", context(cwd, { select, input: vi.fn(), notify: vi.fn() }));

    expect(select).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "mgood-plan-workflow",
        content: expect.stringContaining("work-plans/example/work-plans/001-initial"),
        display: false,
        details: { operation: "execute", target: "work-plans/example/work-plans/001-initial" },
      }),
      { triggerTurn: true },
    );
    expect(sendUserMessage).not.toHaveBeenCalled();
  });

  it("adds a Plan to an explicit Feature under the fixed root", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();

    await commands["mgood:plan-make"]!(
      "feature=work-plans/example Add retry telemetry",
      context(cwd, { select: vi.fn(), input: vi.fn(), notify: vi.fn() }),
    );

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "mgood-plan-workflow",
        content: expect.stringContaining("feature=work-plans/example Add retry telemetry"),
        display: false,
        details: { operation: "create", target: "feature=work-plans/example Add retry telemetry" },
      }),
      { triggerTurn: true },
    );
    expect(sendUserMessage).not.toHaveBeenCalled();
  });

  it("creates remediation from a selected Review", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd, true);
    const { commands, sendMessage, sendUserMessage } = setup();
    const select = vi
      .fn()
      .mockResolvedValueOnce("Create remediation from a Review / 从 Review 创建修复计划")
      .mockResolvedValueOnce(
        "Example Feature / Initial implementation · changes-required · 1 findings · 20260922-review",
      );

    await commands["mgood:plan-make"]!(
      "",
      context(cwd, { select, input: vi.fn(), notify: vi.fn() }),
    );

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "mgood-plan-workflow",
        content: expect.stringContaining(
          "review=work-plans/example/work-plans/001-initial/reviews/20260922-review.md",
        ),
        display: false,
        details: {
          operation: "create",
          target: "review=work-plans/example/work-plans/001-initial/reviews/20260922-review.md",
        },
      }),
      { triggerTurn: true },
    );
    expect(sendUserMessage).not.toHaveBeenCalled();
  });

  it("reviews a completed Plan supplied by path", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd, true);
    const { commands, sendMessage, sendUserMessage } = setup();

    await commands["mgood:plan-review"]!(
      "work-plans/example/work-plans/001-initial",
      context(cwd, { select: vi.fn(), input: vi.fn(), notify: vi.fn() }),
    );

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "mgood-plan-workflow",
        content: expect.stringContaining("work-plans/example/work-plans/001-initial"),
        display: false,
        details: { operation: "review", target: "work-plans/example/work-plans/001-initial" },
      }),
      { triggerTurn: true },
    );
    expect(sendUserMessage).not.toHaveBeenCalled();
  });

  it("lists Feature and Plan status without prompting the model", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();

    await commands["mgood:plan-list"]!("", context(cwd, { notify }));

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.stringContaining("Example Feature (example)"),
      "info",
    );
  });

  it("offers detailed read-only Plan content from the list selector without prompting the model", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();
    const select = vi
      .fn()
      .mockResolvedValueOnce(
        "Example Feature / Initial implementation  ○ not_started · active · review pending · ✓0 ▶0 !0 ○1",
      );

    await commands["mgood:plan-list"]!("", context(cwd, { notify, select }));

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith("Read Plan details / 选择要阅读的计划", expect.any(Array));
    expect(notify).toHaveBeenLastCalledWith(
      expect.stringContaining("title: Initial implementation"),
      "info",
    );
  });

  it("reads a Plan directory including APPROVAL.md without prompting the model", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();

    await commands["mgood:plan-list"]!(
      "work-plans/example/work-plans/001-initial",
      context(cwd, { notify }),
    );

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.stringContaining("title: Initial implementation"),
      "info",
    );
  });

  it("approves a draft only after TUI confirmation and appends Feature history", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    await write(cwd, "work-plans/example/HISTORY.md", "# History\n");
    await write(
      cwd,
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      "---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: draft\nreview_status: pending\nlanguage: en\napproved_at: null\napproval_note: null\n---\n# Approval\n",
    );
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();
    const input = vi.fn();
    const confirm = vi.fn().mockResolvedValue(true);

    await commands["mgood:plan-approve"]!(
      "work-plans/example/work-plans/001-initial",
      context(cwd, { notify, input, confirm }),
    );

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledWith(
      "Approve this Plan? / 是否批准此计划？",
      expect.any(String),
    );
    expect(input).not.toHaveBeenCalled();
    await expect(
      readFile(path.join(cwd, "work-plans/example/work-plans/001-initial/APPROVAL.md"), "utf8"),
    ).resolves.toContain("status: approved");
    await expect(
      readFile(path.join(cwd, "work-plans/example/HISTORY.md"), "utf8"),
    ).resolves.toContain("Plan 001-initial approved");
  });

  it("keeps a Plan draft and records mandatory feedback when approval is declined", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    await write(cwd, "work-plans/example/HISTORY.md", "# History\n");
    await write(
      cwd,
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      "---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: draft\nreview_status: pending\nlanguage: en\napproved_at: null\napproval_note: null\n---\n# Approval\n",
    );
    const before = await readFile(
      path.join(cwd, "work-plans/example/work-plans/001-initial/APPROVAL.md"),
      "utf8",
    );
    const { commands } = setup();

    await commands["mgood:plan-approve"]!(
      "work-plans/example/work-plans/001-initial",
      context(cwd, {
        notify: vi.fn(),
        input: vi.fn().mockResolvedValue("Please clarify the rollback path"),
        confirm: vi.fn().mockResolvedValue(false),
      }),
    );

    await expect(
      readFile(path.join(cwd, "work-plans/example/work-plans/001-initial/APPROVAL.md"), "utf8"),
    ).resolves.toBe(before);
    await expect(
      readFile(path.join(cwd, "work-plans/example/HISTORY.md"), "utf8"),
    ).resolves.toContain("Plan 001-initial not approved — Please clarify the rollback path");
  });

  it("approves a replacement Plan and supersedes its eligible predecessor", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    await write(cwd, "work-plans/example/HISTORY.md", "# History\n");
    await write(
      cwd,
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      "---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: approved\nreview_status: pending\nlanguage: en\n---\n",
    );
    await write(
      cwd,
      "work-plans/example/work-plans/002-replacement/APPROVAL.md",
      "---\ntitle: Replacement\nfeature_id: example\nwork_plan_id: 002-replacement\nschemaVersion: 4\nsequence: 2\nstatus: draft\nreview_status: pending\nlanguage: en\nsupersedes: work-plans/example/work-plans/001-initial\n---\n# Approval\n",
    );
    await write(
      cwd,
      "work-plans/example/work-plans/002-replacement/phases/phase-1/PLAN.md",
      "---\ntitle: Replacement\nphase: phase-1\nstatus: draft\n---\n- [ ] **EX-002: Replace it**\n",
    );
    const { commands } = setup();

    await commands["mgood:plan-approve"]!(
      "work-plans/example/work-plans/002-replacement",
      context(cwd, { notify: vi.fn(), confirm: vi.fn().mockResolvedValue(true) }),
    );

    await expect(
      readFile(path.join(cwd, "work-plans/example/work-plans/002-replacement/APPROVAL.md"), "utf8"),
    ).resolves.toContain("status: approved");
    await expect(
      readFile(path.join(cwd, "work-plans/example/work-plans/001-initial/APPROVAL.md"), "utf8"),
    ).resolves.toContain("status: superseded");
    await expect(
      readFile(path.join(cwd, "work-plans/example/README.md"), "utf8"),
    ).resolves.toContain("current_work_plan: work-plans/002-replacement");
    await expect(
      readFile(path.join(cwd, "work-plans/example/HISTORY.md"), "utf8"),
    ).resolves.toContain("Plan 002-replacement approved; superseded 001-initial");
  });

  it("rejects approval when a replacement Plan points at an ineligible predecessor", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd, true);
    await write(cwd, "work-plans/example/HISTORY.md", "# History\n");
    await write(
      cwd,
      "work-plans/example/work-plans/002-replacement/APPROVAL.md",
      "---\ntitle: Replacement\nfeature_id: example\nwork_plan_id: 002-replacement\nschemaVersion: 4\nsequence: 2\nstatus: draft\nreview_status: pending\nlanguage: en\nsupersedes: work-plans/example/work-plans/001-initial\n---\n# Approval\n",
    );
    await write(
      cwd,
      "work-plans/example/work-plans/002-replacement/phases/phase-1/PLAN.md",
      "---\ntitle: Replacement\nphase: phase-1\nstatus: draft\n---\n- [ ] **EX-002: Replace it**\n",
    );
    const { commands } = setup();
    const notify = vi.fn();

    await commands["mgood:plan-approve"]!(
      "work-plans/example/work-plans/002-replacement",
      context(cwd, { notify, confirm: vi.fn().mockResolvedValue(true) }),
    );

    expect(notify).toHaveBeenCalledWith(
      expect.stringContaining("ineligible superseded Plan"),
      "error",
    );
    await expect(
      readFile(path.join(cwd, "work-plans/example/work-plans/002-replacement/APPROVAL.md"), "utf8"),
    ).resolves.toContain("status: draft");
  });

  it("rejects APPROVAL.md paths rather than using list as an arbitrary file reader", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();

    await commands["mgood:plan-list"]!(
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      context(cwd, { notify }),
    );

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("Invalid Schema v4"), "error");
  });

  it("rejects plan approval outside TUI without writing", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    await write(cwd, "work-plans/example/HISTORY.md", "# History\n");
    await write(
      cwd,
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      "---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: draft\nreview_status: pending\nlanguage: en\napproved_at: null\napproval_note: null\n---\n# Approval\n",
    );
    const before = await readFile(
      path.join(cwd, "work-plans/example/work-plans/001-initial/APPROVAL.md"),
      "utf8",
    );
    const { commands } = setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await commands["mgood:plan-approve"]!("work-plans/example/work-plans/001-initial", {
      cwd,
      mode: "print",
      hasUI: false,
    } as never);

    await expect(
      readFile(path.join(cwd, "work-plans/example/work-plans/001-initial/APPROVAL.md"), "utf8"),
    ).resolves.toBe(before);
    error.mockRestore();
  });

  it("lists in non-TUI mode and rejects paths outside the fixed root", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    const { commands, sendMessage, sendUserMessage } = setup();
    const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await commands["mgood:plan-list"]!("", { cwd, mode: "print", hasUI: false } as never);
    expect(output).toHaveBeenCalledWith(expect.stringContaining("Example Feature (example)"));

    await commands["mgood:plan-do"]!(
      "docs/plans/example",
      context(cwd, { select: vi.fn(), input: vi.fn(), notify: vi.fn() }),
    );
    expect(sendUserMessage).not.toHaveBeenCalled();
    output.mockRestore();
    error.mockRestore();
  });

  it("explains that a draft Plan needs approval before it can execute", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    await write(
      cwd,
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      "---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: draft\nreview_status: pending\nlanguage: en\n---\n",
    );
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();

    await commands["mgood:plan-do"]!("", context(cwd, { select: vi.fn(), input: vi.fn(), notify }));

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("plan-approve"), "warning");
  });

  it("explains that an explicitly selected draft Plan needs approval", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plugin-plan-"));
    await createFeature(cwd);
    await write(
      cwd,
      "work-plans/example/work-plans/001-initial/APPROVAL.md",
      "---\ntitle: Initial implementation\nfeature_id: example\nwork_plan_id: 001-initial\nschemaVersion: 4\nsequence: 1\nstatus: draft\nreview_status: pending\nlanguage: en\n---\n",
    );
    const { commands, sendMessage, sendUserMessage } = setup();
    const notify = vi.fn();

    await commands["mgood:plan-do"]!(
      "work-plans/example/work-plans/001-initial",
      context(cwd, { select: vi.fn(), input: vi.fn(), notify }),
    );

    expect(sendUserMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("plan-approve"), "warning");
  });

  it("does not shadow any namespaced workflow command and fails closed without TUI", async () => {
    const registerCommand = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const on = vi.fn();
    registerPlanWorkflow({
      registerCommand,
      on,
      getCommands: () => [
        {
          name: "mgood:plan-review",
          source: "prompt",
          sourceInfo: { path: "/legacy/review.md" },
        },
      ],
    } as never);
    startSession(on);
    expect(registerCommand).not.toHaveBeenCalled();

    const setupResult = setup();
    await setupResult.commands["mgood:plan-do"]!("", {
      cwd: tmpdir(),
      mode: "print",
      hasUI: false,
    } as never);
    expect(setupResult.sendUserMessage).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
