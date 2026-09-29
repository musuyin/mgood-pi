import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { PreparedPush, PushPreview } from "@mgood-pi/git";
import { describe, expect, it, vi } from "vitest";

import { createCommitHandler, createPushHandler, type GitCore } from "./commands.js";
import registerGitPlugin from "./index.js";

const promptPath = fileURLToPath(new URL("../prompts/agent-commit.md", import.meta.url));

const pushPreview = {
  kind: "push",
  repositoryRoot: "/repo",
  remote: "local",
  remoteUrl: "/remote",
  localBranch: "main",
  localRef: "refs/heads/main",
  destinationRef: "refs/heads/main",
  head: "a".repeat(40),
  refspec: "refs/heads/main:refs/heads/main",
  transferSummary: "unknown",
  warning: "warning",
} satisfies PushPreview;

function core(): GitCore {
  return {
    preparePush: vi.fn().mockResolvedValue({
      kind: "push",
      repositoryRoot: "/repo",
      remote: "local",
      refspec: "refs/heads/main:refs/heads/main",
      fingerprint: "f",
      preview: pushPreview,
    } satisfies PreparedPush),
    executePush: vi.fn().mockResolvedValue({ kind: "push", summary: "done" }),
  };
}

function context(
  options: {
    readonly mode?: "tui" | "print";
    readonly idle?: boolean;
    readonly confirmed?: boolean;
  } = {},
): ExtensionCommandContext {
  const notify = vi.fn();
  return {
    cwd: "/repo",
    mode: options.mode ?? "tui",
    hasUI: options.mode !== "print",
    isIdle: vi.fn(() => options.idle ?? true),
    signal: undefined,
    ui: { notify, confirm: vi.fn().mockResolvedValue(options.confirmed ?? true) },
  } as unknown as ExtensionCommandContext;
}

describe("Git plugin", () => {
  it("registers only the two namespaced commands without startup effects", () => {
    const registerCommand = vi.fn();
    const sendMessage = vi.fn();
    registerGitPlugin({ registerCommand, sendMessage } as never);
    expect(registerCommand.mock.calls.map(([name]) => name)).toEqual([
      "mgood:git-commit",
      "mgood:git-push",
    ]);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("keeps the packaged Prompt one-click, quiet, and fail-closed", async () => {
    const prompt = await readFile(promptPath, "utf8");
    expect(prompt).toContain("one-time authorization");
    expect(prompt).toContain("invocation current worktree");
    expect(prompt).toContain("Git status; staged and unstaged diffs");
    expect(prompt).toContain("recent commit messages/log");
    expect(prompt).toContain("whole-file commits using best-effort implementation functionality");
    expect(prompt).toContain("git add -- <exact paths>");
    expect(prompt).toContain("git commit -m <message>");
    expect(prompt).toContain(
      "best-effort grouping only when the index is clean with no staged paths",
    );
    expect(prompt).toContain("unstaged and/or untracked whole files");
    expect(prompt).toContain(
      "If any staged or mixed staged/unstaged content exists, stop without committing",
    );
    expect(prompt).toContain("conflict/sequencer state");
    expect(prompt).toContain("likely secrets or private keys");
    expect(prompt).toContain("conventional project PNG");
    expect(prompt).toContain("Do not stop merely because a conventional project PNG is binary");
    expect(prompt).toContain("source, Markdown, configuration, lockfile");
    expect(prompt).toContain("submodule/nested repository");
    expect(prompt).toContain("hunk splitting to avoid mixing unrelated changes");
    expect(prompt).toContain("Absolute semantic proof is not required");
    expect(prompt).toContain("do not create a default `chore` or consolidate-remainder commit");
    expect(prompt).toContain("leave them uncommitted");
    expect(prompt).toContain("Never reset or rebuild the index");
    expect(prompt).toContain("Never push automatically");
    expect(prompt).toContain("behavioral instruction, not a core-enforced capability sandbox");
    expect(prompt).toContain("short SHA plus Conventional Commit message");
    expect(prompt).toMatch(/git add \\.|git add -A|git commit -a/u);
    expect(prompt).toContain("Do not delegate planning to a second model, plugin planner");
    expect(prompt).toContain("Do not mechanically group by directory");
    expect(prompt).not.toContain("Stop after the plan");
    expect(prompt).not.toContain("wait for an explicit later confirmation");
    expect(prompt).not.toContain("Present the complete ordered plan");
    expect(prompt).not.toContain("exact repository-relative paths, reasons");
    expect(prompt).not.toContain("consolidate remaining workspace changes");
    expect(prompt).not.toMatch(/CurrentModelCommitPlanner|prepareCommitPlan|executeCommitPlan/u);
  });

  it("injects one hidden custom Prompt in an idle TUI and treats arguments as text", async () => {
    const sendMessage = vi.fn();
    const sendUserMessage = vi.fn();
    const readPrompt = vi.fn().mockResolvedValue("---\nprivate: true\n---\nconstraints: $@");
    await createCommitHandler({ sendMessage, sendUserMessage } as never, readPrompt)(
      "note; $(not executed)",
      context(),
    );
    expect(readPrompt).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
      {
        customType: "mgood-git-commit",
        content: "constraints: note; $(not executed)",
        display: false,
      },
      { triggerTurn: true },
    );
    expect(sendUserMessage).not.toHaveBeenCalled();
  });

  it.each([
    ["non-TUI", context({ mode: "print" })],
    ["busy TUI", context({ idle: false })],
  ])("does not inject a Prompt in %s mode", async (_name, ctx) => {
    const sendMessage = vi.fn();
    const readPrompt = vi.fn();
    await createCommitHandler({ sendMessage }, readPrompt)("", ctx);
    expect(readPrompt).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("reports Prompt read failure without injecting a message", async () => {
    const sendMessage = vi.fn();
    const readPrompt = vi.fn().mockRejectedValue(new Error("missing"));
    await createCommitHandler({ sendMessage }, readPrompt)("", context());
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("reports send failure without a duplicate injection or Prompt details", async () => {
    const sendMessage = vi.fn().mockImplementation(() => {
      throw new Error("send failed");
    });
    const ctx = context();
    await createCommitHandler({ sendMessage }, vi.fn().mockResolvedValue("Prompt: $@"))(
      "sensitive constraint",
      ctx,
    );
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(ctx.ui.notify).toHaveBeenCalledWith(
      "Could not start the hidden commit workflow; no Agent message was sent.",
      "error",
    );
  });

  it("does not use model completion, Git commit planning, confirmation, or delivery queues", async () => {
    const sendMessage = vi.fn();
    const ctx = context();
    Object.assign(ctx, { modelRegistry: { complete: vi.fn() } });
    await createCommitHandler({ sendMessage }, vi.fn().mockResolvedValue("Prompt: $@"))("", ctx);
    expect(ctx.modelRegistry.complete).not.toHaveBeenCalled();
    expect(ctx.ui.confirm).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
      { customType: "mgood-git-commit", content: "Prompt: (none)", display: false },
      { triggerTurn: true },
    );
  });

  it("rejects non-empty push arguments before preparation", async () => {
    const value = core();
    await createPushHandler(value)("--force", context());
    expect(value.preparePush).not.toHaveBeenCalled();
  });

  it("keeps push confirmation and execution independent from the commit Prompt", async () => {
    const value = core();
    await createPushHandler(value)("", context());
    expect(value.preparePush).toHaveBeenCalledWith("/repo");
    expect(value.executePush).toHaveBeenCalledOnce();
  });
});
