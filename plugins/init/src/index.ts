import { spawn } from "node:child_process";
import { once } from "node:events";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  INIT_COMMAND,
  PLUGIN_CATALOG,
  PLUGINS_COMMAND,
  createInitSummary,
  createInstallCommand,
  createPluginCatalogSummary,
  type PluginCatalogEntry,
  type PluginInstallScope,
} from "@mgood-pi/core";

interface ProcessResult {
  readonly exitCode: number;
  readonly stderr: string;
}

type InstallRunner = (args: readonly string[]) => Promise<ProcessResult>;

function formatPluginOption(plugin: PluginCatalogEntry): string {
  return `${plugin.name} — ${plugin.description}`;
}

function formatInstallPreview(plugin: PluginCatalogEntry, scope: PluginInstallScope): string {
  const command = ["pi", ...createInstallCommand(plugin, scope)].join(" ");
  const capabilities = plugin.capabilities.map((capability) => `- ${capability}`).join("\n");
  const scopeDescription =
    scope === "project" ? "this project (.pi/settings.json)" : "your user settings";

  return [
    `Install ${plugin.name} from:`,
    plugin.source,
    "",
    `Scope: ${scopeDescription}`,
    "Capabilities:",
    capabilities,
    "",
    `Command: ${command}`,
    "",
    "Pi packages execute with full system access. Continue only if you trust this package.",
  ].join("\n");
}

export function createPiInstallRunner(): InstallRunner {
  return async (args) => {
    const child = spawn("pi", [...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const [exitCode] = (await once(child, "close")) as [number | null];
    return { exitCode: exitCode ?? 1, stderr };
  };
}

export async function installCatalogPlugin(
  plugin: PluginCatalogEntry,
  scope: PluginInstallScope,
  runInstall: InstallRunner,
): Promise<string> {
  const result = await runInstall(createInstallCommand(plugin, scope));

  if (result.exitCode === 0) {
    return `${plugin.name} installed successfully. Restart Pi to load the new package.`;
  }

  const detail = result.stderr.trim();
  return `Installation failed for ${plugin.name} (exit code ${result.exitCode})${detail ? `: ${detail}` : "."}`;
}

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

  pi.registerCommand(PLUGINS_COMMAND, {
    description: "Browse and explicitly install curated mgood-pi plugins",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        console.log(createPluginCatalogSummary());
        return;
      }

      const selectedLabel = await ctx.ui.select(
        "Install an mgood-pi plugin:",
        PLUGIN_CATALOG.map(formatPluginOption),
      );
      const plugin = PLUGIN_CATALOG.find(
        (candidate) => formatPluginOption(candidate) === selectedLabel,
      );
      if (!plugin) return;

      const selectedScope = await ctx.ui.select("Install scope:", [
        "Global — available in all projects",
        "Project — write to this project's .pi/settings.json",
      ]);
      if (!selectedScope) return;

      const scope: PluginInstallScope = selectedScope.startsWith("Project") ? "project" : "global";
      const confirmed = await ctx.ui.confirm(
        "Confirm plugin installation",
        formatInstallPreview(plugin, scope),
      );
      if (!confirmed) {
        ctx.ui.notify("Plugin installation cancelled.", "info");
        return;
      }

      ctx.ui.notify(`Installing ${plugin.name}…`, "info");
      const result = await installCatalogPlugin(plugin, scope, createPiInstallRunner());
      ctx.ui.notify(result, result.startsWith("Installation failed") ? "error" : "info");
    },
  });
}
