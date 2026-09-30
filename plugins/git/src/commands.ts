import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
const PROMPTS_DIRECTORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
const COMMIT_PROMPT_PATH = path.join(PROMPTS_DIRECTORY, "agent-commit.md");
const COMMIT_PUSH_PROMPT_PATH = path.join(PROMPTS_DIRECTORY, "agent-commit-push.md");
const COMMIT_PUSH_PR_PROMPT_PATH = path.join(PROMPTS_DIRECTORY, "agent-commit-push-pr.md");

function isInteractive(ctx: ExtensionCommandContext): boolean {
  return ctx.mode === "tui" && ctx.hasUI;
}

function notify(
  ctx: ExtensionCommandContext,
  message: string,
  level: "info" | "error" | "warning" = "info",
): void {
  if (ctx.hasUI) ctx.ui.notify(message, level);
  else console.log(message);
}

function promptBody(source: string, args: string): string {
  return source.replace(/^---\n[\s\S]*?\n---\n?/u, "").replace(/\$@/gu, args.trim() || "(none)");
}

export function createCommitHandler(
  pi: Pick<ExtensionAPI, "sendMessage">,
  readPrompt: (path: string, encoding: BufferEncoding) => Promise<string> = readFile,
): (args: string, ctx: ExtensionCommandContext) => Promise<void> {
  return async (args, ctx) => {
    if (!isInteractive(ctx)) {
      notify(ctx, "Git commit requires an interactive idle Pi TUI session.", "error");
      return;
    }
    if (!ctx.isIdle()) {
      notify(
        ctx,
        "Agent is busy. Wait for the current turn to finish, then retry /mgood:git-commit.",
        "warning",
      );
      return;
    }
    try {
      const source = await readPrompt(COMMIT_PROMPT_PATH, "utf8");
      pi.sendMessage(
        {
          customType: "mgood-git-commit",
          content: promptBody(source, args),
          display: false,
        },
        { triggerTurn: true },
      );
    } catch {
      notify(
        ctx,
        "Could not start the hidden commit workflow; no Agent message was sent.",
        "error",
      );
    }
  };
}

function createConfirmedWorkflowHandler(
  command: string,
  customType: "mgood-git-commit-push" | "mgood-git-commit-push-pr",
  promptPath: string,
  confirmationTitle: string,
  confirmationMessage: string,
  readPrompt: (path: string, encoding: BufferEncoding) => Promise<string>,
): (
  pi: Pick<ExtensionAPI, "sendMessage">,
) => (args: string, ctx: ExtensionCommandContext) => Promise<void> {
  return (pi) => async (args, ctx) => {
    if (!isInteractive(ctx)) {
      notify(ctx, "Git mutations require an interactive idle Pi TUI session.", "error");
      return;
    }
    if (!ctx.isIdle()) {
      notify(
        ctx,
        `Agent is busy. Wait for the current turn to finish, then retry /${command}.`,
        "warning",
      );
      return;
    }
    const confirmed = await ctx.ui.confirm(confirmationTitle, confirmationMessage);
    if (!confirmed) {
      notify(ctx, `${confirmationTitle} workflow cancelled.`);
      return;
    }
    try {
      const source = await readPrompt(promptPath, "utf8");
      pi.sendMessage(
        { customType, content: promptBody(source, args), display: false },
        { triggerTurn: true },
      );
    } catch {
      notify(
        ctx,
        `Could not start the ${confirmationTitle.toLowerCase()} workflow; no Agent message was sent.`,
        "error",
      );
    }
  };
}

export function createCommitPushHandler(
  pi: Pick<ExtensionAPI, "sendMessage">,
  readPrompt: (path: string, encoding: BufferEncoding) => Promise<string> = readFile,
): (args: string, ctx: ExtensionCommandContext) => Promise<void> {
  return createConfirmedWorkflowHandler(
    "mgood:git-commit-push",
    "mgood-git-commit-push",
    COMMIT_PUSH_PROMPT_PATH,
    "Confirm commit and push",
    "Authorize the current Agent to inspect this worktree, create a non-protected feature branch if needed, commit exact paths, and push only that branch.\n\nNo push to main, master, dev, or develop is permitted.",
    readPrompt,
  )(pi);
}

export function createCommitPushPrHandler(
  pi: Pick<ExtensionAPI, "sendMessage">,
  readPrompt: (path: string, encoding: BufferEncoding) => Promise<string> = readFile,
): (args: string, ctx: ExtensionCommandContext) => Promise<void> {
  return createConfirmedWorkflowHandler(
    "mgood:git-commit-push-pr",
    "mgood-git-commit-push-pr",
    COMMIT_PUSH_PR_PROMPT_PATH,
    "Confirm commit, push, and pull request",
    "Authorize the current Agent to inspect this worktree, create a non-protected feature branch if needed, commit exact paths, push that branch, and run gh pr create.\n\nNo push to main, master, dev, or develop is permitted.",
    readPrompt,
  )(pi);
}
