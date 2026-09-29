import type { GitExecutor, RepositorySnapshot } from "./contracts.js";
import { GitError } from "./contracts.js";
import { redact } from "./policy.js";

interface CommandOutput {
  readonly stdout: string;
  readonly stderr: string;
}

async function git(
  executor: GitExecutor,
  cwd: string,
  args: readonly string[],
  allowFailure = false,
): Promise<CommandOutput> {
  const result = await executor.run({ args, cwd });
  if (result.cancelled) {
    throw new GitError(
      "cancelled",
      "The Git operation was cancelled.",
      "Run the command again when ready.",
    );
  }
  if (result.outputLimited) {
    throw new GitError(
      "unexpected-output",
      "The Git operation exceeded its output safety limit.",
      "Check Git state and retry with a smaller repository response.",
    );
  }
  if (result.timedOut) {
    throw new GitError(
      "timeout",
      "The Git operation exceeded its safety limit.",
      "Check Git state and retry.",
    );
  }
  if (result.exitCode !== 0 && !allowFailure) {
    throw new GitError(
      "command-failed",
      redact(result.stderr.trim() || "Git command failed."),
      "Check the repository state and retry.",
    );
  }
  return result;
}

async function getOptional(
  executor: GitExecutor,
  cwd: string,
  args: readonly string[],
): Promise<string | undefined> {
  const result = await executor.run({ args, cwd });
  if (result.cancelled || result.outputLimited || result.timedOut) {
    await git(executor, cwd, args);
  }
  return result.exitCode === 0 ? result.stdout.trimEnd() : undefined;
}

export async function inspectRepository(
  executor: GitExecutor,
  cwd: string,
): Promise<RepositorySnapshot> {
  const root = await getOptional(executor, cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) {
    throw new GitError(
      "not-a-repository",
      "The current directory is not inside a Git worktree.",
      "Run the command from a Git worktree.",
    );
  }

  const [head, branch] = await Promise.all([
    getOptional(executor, root, ["rev-parse", "--verify", "HEAD"]),
    getOptional(executor, root, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
  ]);

  const sequencerCandidates = ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG"];
  const sequencer = (
    await Promise.all(
      sequencerCandidates.map(async (name) =>
        (await getOptional(executor, root, ["rev-parse", "--verify", "--quiet", name]))
          ? name
          : undefined,
      ),
    )
  ).filter((value): value is string => value !== undefined);

  return { repositoryRoot: root, head: head ?? "(unborn)", branch, sequencer };
}

export async function readConfiguredUpstream(
  executor: GitExecutor,
  repositoryRoot: string,
  branch: string,
): Promise<{ readonly remote: string; readonly mergeRef: string; readonly remoteUrl: string }> {
  const remote = await getOptional(executor, repositoryRoot, [
    "config",
    "--get",
    `branch.${branch}.remote`,
  ]);
  const mergeRef = await getOptional(executor, repositoryRoot, [
    "config",
    "--get",
    `branch.${branch}.merge`,
  ]);
  if (!remote || !mergeRef) {
    throw new GitError(
      "policy-rejected",
      "The current branch has no configured upstream.",
      "Configure an upstream outside this plugin, then run the command again.",
    );
  }
  const remoteUrl = await getOptional(executor, repositoryRoot, ["remote", "get-url", remote]);
  if (!remoteUrl) {
    throw new GitError(
      "policy-rejected",
      "The configured upstream remote does not exist.",
      "Correct the branch upstream configuration and retry.",
    );
  }
  return { remote, mergeRef, remoteUrl };
}
