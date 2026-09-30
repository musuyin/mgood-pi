import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

import { afterEach, describe, expect, it, vi } from "vitest";

import { executePush, preparePush, redact, SpawnGitExecutor } from "./index.js";

const directories: string[] = [];

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  directories.push(directory);
  return directory;
}

async function runGit(cwd: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", [...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`git ${args.join(" ")} failed: ${stderr}`));
    });
  });
}

async function createRepository(): Promise<string> {
  const directory = await temporaryDirectory("mgood-pi-git-");
  await runGit(directory, ["init", "--initial-branch=main"]);
  await runGit(directory, ["config", "user.name", "Test User"]);
  await runGit(directory, ["config", "user.email", "test@example.invalid"]);
  await writeFile(join(directory, "initial.txt"), "initial\n");
  await runGit(directory, ["add", "initial.txt"]);
  await runGit(directory, ["commit", "-m", "initial"]);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(async (directory) => rm(directory, { recursive: true })),
  );
});

describe("Git core policy", () => {
  it("redacts embedded URL credentials", () => {
    expect(redact("https://alice:secret@example.test/repo.git")).toBe(
      "https://***:***@example.test/repo.git",
    );
  });
});

describe("prepared configured-upstream push", () => {
  it("pushes once to the configured local bare remote using the exact branch refspec", async () => {
    const repository = await createRepository();
    const remote = await temporaryDirectory("mgood-pi-remote-");
    await runGit(remote, ["init", "--bare"]);
    await runGit(repository, ["remote", "add", "upstream-test", remote]);
    await runGit(repository, ["config", "branch.main.remote", "upstream-test"]);
    await runGit(repository, ["config", "branch.main.merge", "refs/heads/feature-test"]);
    const executor = new SpawnGitExecutor();

    const prepared = await preparePush(executor, repository);
    expect(prepared.preview.remote).toBe("upstream-test");
    expect(prepared.preview.refspec).toBe("refs/heads/main:refs/heads/feature-test");
    await executePush(executor, prepared);

    expect(await runGit(remote, ["rev-parse", "refs/heads/feature-test"])).toMatch(
      /^[0-9a-f]{40}$/u,
    );
  });

  it.each(["main", "master", "dev", "develop"])(
    "refuses configured upstream pushes to protected branch %s",
    async (branch) => {
      const repository = await createRepository();
      const remote = await temporaryDirectory("mgood-pi-remote-");
      await runGit(remote, ["init", "--bare"]);
      await runGit(repository, ["remote", "add", "upstream-test", remote]);
      await runGit(repository, ["config", "branch.main.remote", "upstream-test"]);
      await runGit(repository, ["config", "branch.main.merge", `refs/heads/${branch}`]);

      await expect(preparePush(new SpawnGitExecutor(), repository)).rejects.toMatchObject({
        code: "policy-rejected",
      });
      await expect(runGit(remote, ["rev-parse", `refs/heads/${branch}`])).rejects.toThrow();
    },
  );

  it("does not push when upstream target drifts after preview", async () => {
    const repository = await createRepository();
    const remote = await temporaryDirectory("mgood-pi-remote-");
    await runGit(remote, ["init", "--bare"]);
    await runGit(repository, ["remote", "add", "upstream-test", remote]);
    await runGit(repository, ["config", "branch.main.remote", "upstream-test"]);
    await runGit(repository, ["config", "branch.main.merge", "refs/heads/feature-test"]);
    const executor = new SpawnGitExecutor();
    const prepared = await preparePush(executor, repository);
    await runGit(repository, ["config", "branch.main.merge", "refs/heads/other"]);

    await expect(executePush(executor, prepared)).rejects.toMatchObject({ code: "state-drift" });
    await expect(runGit(remote, ["rev-parse", "refs/heads/feature-test"])).rejects.toThrow();
  });

  it("rejects credential-only remote URL drift without exposing credentials or pushing", async () => {
    const repository = await createRepository();
    await runGit(repository, [
      "remote",
      "add",
      "upstream-test",
      "https://alice:one@example.test/repo.git/",
    ]);
    await runGit(repository, ["config", "branch.main.remote", "upstream-test"]);
    await runGit(repository, ["config", "branch.main.merge", "refs/heads/feature-test"]);
    const executor = new SpawnGitExecutor();
    const prepared = await preparePush(executor, repository);
    await runGit(repository, [
      "remote",
      "set-url",
      "upstream-test",
      "https://alice:two@example.test/repo.git/",
    ]);

    expect(prepared.preview.remoteUrl).toBe("https://***:***@example.test/repo.git/");
    await expect(executePush(executor, prepared)).rejects.toMatchObject({ code: "state-drift" });
  });
});

describe("SpawnGitExecutor", () => {
  it("cleans the abort listener when child spawn fails", async () => {
    const removeEventListener = vi.fn();
    const signal = {
      aborted: false,
      addEventListener: vi.fn(),
      removeEventListener,
    } as unknown as AbortSignal;

    await expect(
      new SpawnGitExecutor().run({ args: ["status"], cwd: "/definitely/missing/mgood-pi", signal }),
    ).rejects.toMatchObject({ code: "command-failed" });
    expect(removeEventListener).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
