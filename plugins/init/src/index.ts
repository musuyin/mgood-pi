import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { INIT_COMMAND, createInitSummary } from "@mgood-pi/core";

export default function registerInitPlugin(pi: ExtensionAPI): void {
  pi.registerCommand(INIT_COMMAND, {
    description: "Preview the mgood-pi project bootstrap layout",
    handler: async (_args, ctx) => {
      const summary = createInitSummary(ctx.cwd);

      if (ctx.hasUI) {
        ctx.ui.notify(summary, "info");
        return;
      }

      console.log(summary);
    },
  });
}
