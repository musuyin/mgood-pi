export const KIT_NAME = "mgood-pi";

export const INIT_COMMAND = "mgood:init";
export const MARKET_COMMAND = "mgood:market";

export type PluginInstallScope = "global" | "project";

export interface PluginCatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly source: `npm:${string}`;
  readonly capabilities: readonly string[];
}

export const PLUGIN_CATALOG: readonly PluginCatalogEntry[] = [
  {
    id: "plan-workflow",
    name: "Plan Workflow",
    description: "Create, inspect, explicitly approve, and execute phased implementation plans.",
    source: "npm:@mgood-pi/plugin-plan-workflow@1.0.0",
    capabilities: [
      "Registers /mgood:plan-make, /mgood:plan-list, /mgood:plan-approve, /mgood:plan-do, and /mgood:plan-review",
      "Reads Schema v4 Plan APPROVAL.md files and requires explicit TUI approval before execution",
    ],
  },
] as const;

export function createInstallCommand(
  plugin: PluginCatalogEntry,
  scope: PluginInstallScope,
): readonly string[] {
  return ["install", ...(scope === "project" ? ["-l"] : []), plugin.source];
}

export function createPluginCatalogSummary(): string {
  const plugins = PLUGIN_CATALOG.map(
    (plugin) => `- ${plugin.name}: ${plugin.description}\n  ${plugin.source}`,
  ).join("\n");

  return [
    "mgood-pi plugin catalog:",
    plugins,
    "",
    "Install manually with: pi install <source>",
    "Use /mgood:market in an interactive Pi session for guided installation.",
  ].join("\n");
}

export interface InitFile {
  readonly path: string;
  readonly purpose: string;
}

export const INITIAL_PROJECT_FILES: readonly InitFile[] = [
  {
    path: "AGENTS.md",
    purpose: "Project instructions discovered automatically by Pi.",
  },
  {
    path: ".pi/extensions/",
    purpose: "Project-local Pi extensions.",
  },
  {
    path: ".pi/skills/",
    purpose: "Project-local reusable Agent Skills.",
  },
] as const;

export function createInitSummary(cwd: string): string {
  const files = INITIAL_PROJECT_FILES.map((file) => `- ${file.path}: ${file.purpose}`).join("\n");

  return [`${KIT_NAME} project bootstrap is ready for ${cwd}.`, "", "Planned files:", files].join(
    "\n",
  );
}
