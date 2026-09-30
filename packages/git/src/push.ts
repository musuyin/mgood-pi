import type { GitExecutor, PreparedPush, PushResult, RepositorySnapshot } from "./contracts.js";
import { GitError } from "./contracts.js";
import { makeFingerprint, redact, validateRef } from "./policy.js";
import { inspectRepository, readConfiguredUpstream } from "./repository.js";

const PROTECTED_BRANCHES = new Set(["main", "master", "dev", "develop"]);

interface PushState {
  readonly snapshot: RepositorySnapshot & { readonly branch: string };
  readonly remote: string;
  readonly mergeRef: string;
  readonly remoteUrl: string;
  readonly refspec: string;
}

function ensurePushAllowed(
  snapshot: RepositorySnapshot,
): asserts snapshot is RepositorySnapshot & { branch: string } {
  if (!snapshot.branch || snapshot.head === "(unborn)") {
    throw new GitError(
      "policy-rejected",
      "Cannot push from detached or unborn HEAD.",
      "Check out a branch with a commit and create a new preview.",
    );
  }
  if (snapshot.sequencer.length > 0) {
    throw new GitError(
      "operation-in-progress",
      "Cannot push while another Git operation is active.",
      "Finish or abort the in-progress Git operation, then create a new preview.",
    );
  }
}

async function readPushState(executor: GitExecutor, cwd: string): Promise<PushState> {
  const snapshot = await inspectRepository(executor, cwd);
  ensurePushAllowed(snapshot);
  const upstream = await readConfiguredUpstream(executor, snapshot.repositoryRoot, snapshot.branch);
  const remote = validateRef(upstream.remote, "upstream remote");
  const mergeRef = validateRef(upstream.mergeRef, "upstream merge ref");
  if (!mergeRef.startsWith("refs/heads/")) {
    throw new GitError(
      "policy-rejected",
      "The configured upstream destination is not a branch ref.",
      "Configure a refs/heads/* upstream outside this plugin.",
    );
  }
  const destinationBranch = mergeRef.slice("refs/heads/".length);
  if (PROTECTED_BRANCHES.has(destinationBranch.toLowerCase())) {
    throw new GitError(
      "policy-rejected",
      `Refusing to push to protected branch ${destinationBranch}.`,
      "Push from a non-protected feature branch and open a pull request instead.",
    );
  }
  const localRef = `refs/heads/${validateRef(snapshot.branch, "current branch")}`;
  return {
    snapshot,
    remote,
    mergeRef,
    remoteUrl: upstream.remoteUrl,
    refspec: `${localRef}:${mergeRef}`,
  };
}

function pushFingerprint(state: PushState): string {
  return makeFingerprint({
    repositoryRoot: state.snapshot.repositoryRoot,
    head: state.snapshot.head,
    branch: state.snapshot.branch,
    sequencer: state.snapshot.sequencer,
    remote: state.remote,
    mergeRef: state.mergeRef,
    remoteIdentity: makeFingerprint(state.remoteUrl),
    refspec: state.refspec,
  });
}

export async function preparePush(executor: GitExecutor, cwd: string): Promise<PreparedPush> {
  const state = await readPushState(executor, cwd);
  const branch = state.snapshot.branch;
  return {
    kind: "push",
    repositoryRoot: state.snapshot.repositoryRoot,
    remote: state.remote,
    refspec: state.refspec,
    fingerprint: pushFingerprint(state),
    preview: {
      kind: "push",
      repositoryRoot: state.snapshot.repositoryRoot,
      remote: state.remote,
      remoteUrl: redact(state.remoteUrl),
      localBranch: branch,
      localRef: `refs/heads/${branch}`,
      destinationRef: state.mergeRef,
      head: state.snapshot.head,
      refspec: state.refspec,
      transferSummary:
        "Local tracking information was not queried; remote state is unverified until approved push.",
      warning:
        "Transport, credential helpers, hooks, and server policy can affect the operation outside this plugin.",
    },
  };
}

export async function executePush(
  executor: GitExecutor,
  prepared: PreparedPush,
  signal?: AbortSignal,
): Promise<PushResult> {
  const current = await readPushState(executor, prepared.repositoryRoot);
  if (pushFingerprint(current) !== prepared.fingerprint) {
    throw new GitError(
      "state-drift",
      "Git push target changed after the preview; no push was attempted.",
      "Run the applicable Git workflow again to review the current target.",
    );
  }
  const result = await executor.run({
    args: ["push", "--porcelain", prepared.remote, prepared.refspec],
    cwd: prepared.repositoryRoot,
    ...(signal ? { signal } : {}),
  });
  if (result.cancelled || result.outputLimited || result.timedOut) {
    throw new GitError(
      result.cancelled ? "cancelled" : result.outputLimited ? "unexpected-output" : "timeout",
      "Push was interrupted; the remote outcome may be unknown.",
      "Inspect the configured remote branch before manually retrying.",
      { remoteOutcomeUnknown: true },
    );
  }
  if (result.exitCode !== 0) {
    throw new GitError(
      "command-failed",
      redact(result.stderr.trim()) || "Git rejected the push.",
      "Inspect the configured remote branch and Git error before manually retrying.",
    );
  }
  return { kind: "push", summary: result.stdout.trim() || "Push completed." };
}
