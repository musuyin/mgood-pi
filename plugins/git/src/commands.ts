import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import {
  executePush,
  GitError,
  preparePush,
  SpawnGitExecutor,
  type GitExecutor,
  type PreparedPush,
  type PushResult,
} from "@mgood-pi/git";

import { renderPushPreview } from "./render.js";

const PROMPT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts/agent-commit.md",
);

export interface GitCore {
  preparePush(cwd: string): Promise<PreparedPush>;
  executePush(prepared: PreparedPush, signal?: AbortSignal): Promise<PushResult>;
}

export function createGitCore(executor: GitExecutor = new SpawnGitExecutor()): GitCore {
  return {
    preparePush: (cwd) => preparePush(executor, cwd),
    executePush: (prepared, signal) => executePush(executor, prepared, signal),
  };
}

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

function reportError(ctx: ExtensionCommandContext, error: unknown): void {
  if (error instanceof GitError) notify(ctx, `${error.message} ${error.remediation}`, "error");
  else if (error instanceof Error) notify(ctx, `Git command failed: ${error.message}`, "error");
  else notify(ctx, "Git command failed unexpectedly. Check the repository and try again.", "error");
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
      const source = await readPrompt(PROMPT_PATH, "utf8");
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

export function createPushHandler(
  core: GitCore,
): (args: string, ctx: ExtensionCommandContext) => Promise<void> {
  return async (args, ctx) => {
    if (args.trim()) {
      notify(ctx, "Usage: /mgood:git-push", "error");
      return;
    }
    if (!isInteractive(ctx)) {
      notify(
        ctx,
        "Git mutations require an interactive Pi TUI session with confirmation.",
        "error",
      );
      return;
    }
    try {
      const prepared = await core.preparePush(ctx.cwd);
      const confirmed = await ctx.ui.confirm(
        "Confirm configured-upstream push",
        renderPushPreview(prepared.preview),
      );
      if (!confirmed) {
        notify(ctx, "Push cancelled.");
        return;
      }
      const result = await core.executePush(prepared, ctx.signal);
      notify(ctx, `Push completed.\n${result.summary}`);
    } catch (error) {
      reportError(ctx, error);
    }
  };
}
