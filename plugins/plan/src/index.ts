import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

const COMMAND = "mgood-pi:plan";
const PROMPT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "prompts",
  "plan.md",
);

function report(ctx: ExtensionCommandContext, message: string): void {
  if (ctx.hasUI) ctx.ui.notify(message, "warning");
  else console.error(message);
}

async function requestFrom(
  args: string,
  ctx: ExtensionCommandContext,
): Promise<string | undefined> {
  const request = args.trim();
  if (request) return request;
  if (!ctx.hasUI || ctx.mode !== "tui") {
    report(ctx, "Usage: /mgood-pi:plan <request>");
    return undefined;
  }
  return (await ctx.ui.input("What should be planned?"))?.trim() || undefined;
}

async function dispatch(pi: ExtensionAPI, request: string): Promise<void> {
  const template = await readFile(PROMPT_PATH, "utf8");
  const content = template.replace("$@", () => request);
  pi.sendMessage(
    {
      customType: "plan",
      content,
      display: false,
      details: { request },
    },
    { triggerTurn: true },
  );
}

export default function registerPlan(pi: ExtensionAPI): void {
  let registered = false;
  pi.on("session_start", () => {
    if (registered) return;
    if (pi.getCommands().some(({ name }) => name === COMMAND)) {
      console.error(`Plan did not register /${COMMAND}; command already exists.`);
      return;
    }
    pi.registerCommand(COMMAND, {
      description: "Clarify a request and create one implementation plan",
      handler: async (args, ctx) => {
        if (!ctx.isIdle()) {
          report(ctx, "Agent is busy.");
          return;
        }
        const request = await requestFrom(args, ctx);
        if (request) await dispatch(pi, request);
      },
    });
    registered = true;
  });
}
