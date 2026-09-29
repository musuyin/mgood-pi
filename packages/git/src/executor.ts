import { spawn } from "node:child_process";

import type { GitCommand, GitCommandResult, GitExecutor } from "./contracts.js";
import { GitError } from "./contracts.js";
import { redact } from "./policy.js";

export interface SpawnGitExecutorOptions {
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 512 * 1024;

export class SpawnGitExecutor implements GitExecutor {
  private readonly timeoutMs: number;
  private readonly maxOutputBytes: number;

  public constructor(options: SpawnGitExecutorOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  }

  public async run(command: GitCommand): Promise<GitCommandResult> {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let outputBytes = 0;
      let timedOut = false;
      let outputLimited = false;
      let cancelled = false;
      let settled = false;
      const child = spawn("git", [...command.args], {
        cwd: command.cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_PAGER: "cat" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const cleanup = (): void => {
        clearTimeout(timeout);
        command.signal?.removeEventListener("abort", abort);
      };
      const finish = (result: GitCommandResult): void => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };
      const fail = (error: Error): void => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };
      const stop = (): void => {
        if (!child.killed) child.kill("SIGTERM");
      };
      const abort = (): void => {
        cancelled = true;
        stop();
      };
      const timeout = setTimeout(() => {
        timedOut = true;
        stop();
      }, this.timeoutMs);
      timeout.unref();

      if (command.signal?.aborted) abort();
      command.signal?.addEventListener("abort", abort, { once: true });

      const append = (target: "stdout" | "stderr", chunk: Buffer): void => {
        outputBytes += chunk.byteLength;
        if (outputBytes > this.maxOutputBytes) {
          outputLimited = true;
          stop();
          return;
        }
        if (target === "stdout") stdout += chunk.toString("utf8");
        else stderr += chunk.toString("utf8");
      };

      child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
      child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));
      child.on("error", (error: Error) => {
        fail(
          new GitError(
            "command-failed",
            redact(error.message),
            "Ensure Git is installed and retry the command.",
          ),
        );
      });
      child.on("close", (exitCode: number | null) => {
        finish({
          exitCode: exitCode ?? 1,
          stdout,
          stderr,
          timedOut,
          outputLimited,
          cancelled,
        });
      });
    });
  }
}
