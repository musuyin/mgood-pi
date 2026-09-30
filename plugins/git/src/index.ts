import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { COMMIT_COMMAND, COMMIT_PUSH_COMMAND } from "@mgood-pi/git";

import {
  createCommitHandler,
  createCommitPushHandler,
  createCommitPushPrHandler,
} from "./commands.js";

const COMMIT_PUSH_PR_COMMAND = "mgood:git-commit-push-pr";

export default function registerGitPlugin(pi: ExtensionAPI): void {
  pi.registerCommand(COMMIT_COMMAND, {
    description: "Authorize the current Agent to create safe feature-oriented commits",
    handler: createCommitHandler(pi),
  });
  pi.registerCommand(COMMIT_PUSH_PR_COMMAND, {
    description: "Confirm and authorize the Agent to create a branch, commit, push, and open a PR",
    handler: createCommitPushPrHandler(pi),
  });
  pi.registerCommand(COMMIT_PUSH_COMMAND, {
    description: "Confirm and authorize the Agent to create safe commits and push a feature branch",
    handler: createCommitPushHandler(pi),
  });
}
