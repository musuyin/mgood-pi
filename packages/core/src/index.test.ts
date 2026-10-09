import { describe, expect, it } from "vitest";

import {
  INIT_COMMAND,
  INITIAL_PROJECT_FILES,
  MARKET_COMMAND,
  PLUGIN_CATALOG,
  createInitSummary,
  createInstallCommand,
  createPluginCatalogSummary,
} from "./index.js";

describe("core contracts", () => {
  it("defines the namespaced bootstrap and marketplace commands", () => {
    expect(INIT_COMMAND).toBe("mgood:init");
    expect(MARKET_COMMAND).toBe("mgood:market");
  });

  it("describes the Pi-native project files", () => {
    expect(INITIAL_PROJECT_FILES.map((file) => file.path)).toEqual([
      "AGENTS.md",
      ".pi/extensions/",
      ".pi/skills/",
    ]);
  });

  it("includes the selected workspace in the bootstrap summary", () => {
    expect(createInitSummary("/workspace/demo")).toContain("/workspace/demo");
  });

  it("publishes the focused Plan package in the curated catalog", () => {
    expect(PLUGIN_CATALOG[0]).toMatchObject({
      id: "plan",
      name: "Plan",
      source: "npm:@mgood-pi/plan@1.0.0",
    });
    expect(PLUGIN_CATALOG[0]?.capabilities).toContain(
      "Writes one Markdown file under tmp/plans/ and does not implement it",
    );
  });

  it("creates safe argument arrays for global and project plugin installs", () => {
    const plugin = PLUGIN_CATALOG[0]!;

    expect(createInstallCommand(plugin, "global")).toEqual(["install", plugin.source]);
    expect(createInstallCommand(plugin, "project")).toEqual(["install", "-l", plugin.source]);
  });

  it("lists curated plugins with a manual installation fallback", () => {
    const summary = createPluginCatalogSummary();

    expect(summary).toContain(PLUGIN_CATALOG[0]!.name);
    expect(summary).toContain(PLUGIN_CATALOG[0]!.source);
    expect(summary).toContain("pi install <source>");
  });
});
