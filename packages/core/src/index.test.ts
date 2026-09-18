import { describe, expect, it } from "vitest";

import { INIT_COMMAND, INITIAL_PROJECT_FILES, createInitSummary } from "./index.js";

describe("core contracts", () => {
  it("defines the namespaced bootstrap command", () => {
    expect(INIT_COMMAND).toBe("mgood:init");
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
});
