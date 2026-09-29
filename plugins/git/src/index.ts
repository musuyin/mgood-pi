import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { COMMIT_COMMAND, PUSH_COMMAND } from "@mgood-pi/git";

import { createCommitHandler, createGitCore, createPushHandler } from "./commands.js";

export default function registerGitPlugin(pi: ExtensionAPI): void {
  const core = createGitCore();

  pi.registerCommand(COMMIT_COMMAND, {
    description: "Authorize the current Agent to create safe feature-oriented commits",
    handler: createCommitHandler(pi),
  });
  pi.registerCommand(PUSH_COMMAND, {
    description: "Preview and explicitly push the current branch to its configured upstream",
    handler: createPushHandler(core),
  });
}
