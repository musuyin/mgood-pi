export const COMMIT_COMMAND = "mgood:git-commit";
export const PUSH_COMMAND = "mgood:git-push";

export interface GitCommand {
  readonly args: readonly string[];
  readonly cwd: string;
  readonly signal?: AbortSignal;
}

export interface GitCommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly outputLimited: boolean;
  readonly cancelled: boolean;
}

export interface GitExecutor {
  run(command: GitCommand): Promise<GitCommandResult>;
}

export type GitErrorCode =
  | "cancelled"
  | "command-failed"
  | "invalid-input"
  | "not-a-repository"
  | "operation-in-progress"
  | "policy-rejected"
  | "state-drift"
  | "timeout"
  | "unexpected-output";

export class GitError extends Error {
  public readonly code: GitErrorCode;
  public readonly remediation: string;
  public readonly remoteOutcomeUnknown: boolean;

  public constructor(
    code: GitErrorCode,
    message: string,
    remediation: string,
    options: { readonly remoteOutcomeUnknown?: boolean } = {},
  ) {
    super(message);
    this.name = "GitError";
    this.code = code;
    this.remediation = remediation;
    this.remoteOutcomeUnknown = options.remoteOutcomeUnknown ?? false;
  }
}

export interface RepositorySnapshot {
  readonly repositoryRoot: string;
  readonly head: string;
  readonly branch: string | undefined;
  readonly sequencer: readonly string[];
}

export interface PushPreview {
  readonly kind: "push";
  readonly repositoryRoot: string;
  readonly remote: string;
  readonly remoteUrl: string;
  readonly localBranch: string;
  readonly localRef: string;
  readonly destinationRef: string;
  readonly head: string;
  readonly refspec: string;
  readonly transferSummary: string;
  readonly warning: string;
}

export interface PreparedPush {
  readonly kind: "push";
  readonly preview: PushPreview;
  readonly fingerprint: string;
  readonly repositoryRoot: string;
  readonly remote: string;
  readonly refspec: string;
}

export interface PushResult {
  readonly kind: "push";
  readonly summary: string;
}
