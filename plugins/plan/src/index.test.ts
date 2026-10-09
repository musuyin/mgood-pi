import { describe, expect, it, vi } from "vitest";

import registerPlan from "./index.js";

function setup(commands: readonly { name: string }[] = []) {
  const registerCommand = vi.fn();
  const sendMessage = vi.fn();
  const on = vi.fn();
  registerPlan({ registerCommand, sendMessage, getCommands: () => commands, on } as never);
  (on.mock.calls[0]?.[1] as () => void)();
  return {
    registerCommand,
    sendMessage,
    command: registerCommand.mock.calls[0]?.[1]?.handler as
      ((args: string, ctx: never) => Promise<void>) | undefined,
  };
}

function context(overrides: object = {}) {
  return {
    cwd: "/project",
    mode: "tui",
    hasUI: true,
    isIdle: () => true,
    ui: { input: vi.fn(), notify: vi.fn() },
    ...overrides,
  } as never;
}

describe("plan plugin", () => {
  it("registers /mgood-pi:plan after session start", () => {
    const { registerCommand } = setup();

    expect(registerCommand).toHaveBeenCalledWith(
      "mgood-pi:plan",
      expect.objectContaining({
        description: expect.any(String),
        handler: expect.any(Function),
      }),
    );
  });

  it("sends the request with private planning guidance", async () => {
    const { command, sendMessage } = setup();

    await command?.("Add retry support", context());

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "plan",
        display: false,
        details: { request: "Add retry support" },
        content: expect.stringMatching(/Add retry support[\s\S]*tmp\/plans\//u),
      }),
      { triggerTurn: true },
    );
  });

  it("prompts for a missing request in TUI mode", async () => {
    const { command, sendMessage } = setup();
    const input = vi.fn().mockResolvedValue("Plan an export command");

    await command?.("", context({ ui: { input, notify: vi.fn() } }));

    expect(input).toHaveBeenCalledWith("What should be planned?");
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ details: { request: "Plan an export command" } }),
      { triggerTurn: true },
    );
  });

  it("prints usage instead of prompting in non-interactive mode", async () => {
    const { command, sendMessage } = setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await command?.("", context({ mode: "print", hasUI: false }));

    expect(error).toHaveBeenCalledWith("Usage: /mgood-pi:plan <request>");
    expect(sendMessage).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("does not shadow an existing /mgood-pi:plan command", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { registerCommand } = setup([{ name: "mgood-pi:plan" }]);

    expect(registerCommand).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "Plan did not register /mgood-pi:plan; command already exists.",
    );
    error.mockRestore();
  });
});
