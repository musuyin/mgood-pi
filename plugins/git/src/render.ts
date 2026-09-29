import type { PushPreview } from "@mgood-pi/git";
import { escapeForPreview } from "@mgood-pi/git";

export function renderPushPreview(preview: PushPreview): string {
  return [
    "Push the current branch to its configured upstream?",
    "",
    `Repository: ${escapeForPreview(preview.repositoryRoot)}`,
    `Remote: ${escapeForPreview(preview.remote)}`,
    `Remote URL: ${escapeForPreview(preview.remoteUrl)}`,
    `Local: ${escapeForPreview(preview.localRef)} (${escapeForPreview(preview.head)})`,
    `Destination: ${escapeForPreview(preview.destinationRef)}`,
    `Exact refspec: ${escapeForPreview(preview.refspec)}`,
    "",
    preview.transferSummary,
    preview.warning,
  ].join("\n");
}
