import { describe, expect, it, vi } from "vitest";

import { PLUGIN_CATALOG } from "@mgood-pi/core";

import registerMarketPlugin, { installCatalogPlugin } from "./index.js";

describe("market plugin", () => {
  it("registers namespaced bootstrap and marketplace commands", () => {
    const registerCommand = vi.fn();

    registerMarketPlugin({ registerCommand } as never);

    expect(registerCommand).toHaveBeenCalledWith(
      "mgood:init",
      expect.objectContaining({ description: expect.any(String), handler: expect.any(Function) }),
    );
    expect(registerCommand).toHaveBeenCalledWith(
      "mgood:market",
      expect.objectContaining({ description: expect.any(String), handler: expect.any(Function) }),
    );
  });

  it("installs the selected catalog package with direct project-scope arguments", async () => {
    const plugin = PLUGIN_CATALOG[0]!;
    const runInstall = vi.fn().mockResolvedValue({ exitCode: 0, stderr: "" });

    const message = await installCatalogPlugin(plugin, "project", runInstall);

    expect(runInstall).toHaveBeenCalledWith(["install", "-l", plugin.source]);
    expect(message).toContain("installed successfully");
  });

  it("reports stderr when Pi installation fails", async () => {
    const message = await installCatalogPlugin(PLUGIN_CATALOG[0]!, "global", async () => ({
      exitCode: 23,
      stderr: "registry unavailable\n",
    }));

    expect(message).toContain("exit code 23");
    expect(message).toContain("registry unavailable");
  });
});
