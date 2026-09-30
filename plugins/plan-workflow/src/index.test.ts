import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import registerPlanWorkflow from "./index.js";

const ROOT = path.join("tmp", "work-plans");

async function write(root: string, relative: string, content: string): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function createPlan(root: string): Promise<void> {
  await write(
    root,
    `${ROOT}/example/PLAN.md`,
    "---\ntitle: Example\nfeature_id: example\nschemaVersion: 5\nstatus: active\nlanguage: en\n---\n# Plan\n- [ ] Build it\n",
  );
  await write(root, `${ROOT}/example/REVIEW.md`, "# Review\n");
}

function setup() {
  const registerCommand = vi.fn();
  const sendMessage = vi.fn();
  const on = vi.fn();
  registerPlanWorkflow({ registerCommand, sendMessage, getCommands: () => [], on } as never);
  (on.mock.calls[0]?.[1] as () => void)();
  return {
    registerCommand,
    sendMessage,
    command: registerCommand.mock.calls[0]?.[1].handler as (
      args: string,
      ctx: never,
    ) => Promise<void>,
  };
}

function context(cwd: string, ui: object) {
  return {
    cwd,
    mode: "tui",
    hasUI: true,
    isIdle: () => true,
    ui: { select: vi.fn(), input: vi.fn(), confirm: vi.fn(), notify: vi.fn(), ...ui },
  } as never;
}

describe("local Plan Workflow plugin", () => {
  it("registers only the local /mgood:plan command", () => {
    const { registerCommand } = setup();
    expect(registerCommand.mock.calls.map(([name]) => name)).toEqual(["mgood:plan"]);
  });

  it("creates a new local Plan through a hidden custom message", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plan-lite-"));
    const { command, sendMessage } = setup();
    await command("Add retry", context(cwd, {}));
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "mgood-plan-workflow",
        display: false,
        details: { operation: "plan", target: "new Add retry" },
      }),
      { triggerTurn: true },
    );
  });

  it("opens a local Plan path and dispatches execution from the menu", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plan-lite-"));
    await createPlan(cwd);
    const { command, sendMessage } = setup();
    await command(
      `${ROOT}/example`,
      context(cwd, { select: vi.fn().mockResolvedValue("Continue implementation") }),
    );
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        details: { operation: "execute", target: `${ROOT}/example` },
        display: false,
      }),
      { triggerTurn: true },
    );
  });

  it("reads local Plan content without a model turn", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mgood-plan-lite-"));
    await createPlan(cwd);
    const { command, sendMessage } = setup();
    const notify = vi.fn();
    await command(
      `${ROOT}/example`,
      context(cwd, { select: vi.fn().mockResolvedValue("Read plan"), notify }),
    );
    expect(sendMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("# Plan"), "info");
  });

  it("does not shadow the local command and rejects non-TUI use", async () => {
    const registerCommand = vi.fn();
    const on = vi.fn();
    registerPlanWorkflow({
      registerCommand,
      getCommands: () => [{ name: "mgood:plan" }],
      on,
    } as never);
    (on.mock.calls[0]?.[1] as () => void)();
    expect(registerCommand).not.toHaveBeenCalled();
    const { command, sendMessage } = setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await command("new", { cwd: tmpdir(), mode: "print", hasUI: false } as never);
    expect(sendMessage).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
