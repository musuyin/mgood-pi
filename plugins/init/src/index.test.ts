import { describe, expect, it, vi } from "vitest";

import registerInitPlugin from "./index.js";

describe("init plugin", () => {
  it("registers the namespaced bootstrap command", () => {
    const registerCommand = vi.fn();

    registerInitPlugin({ registerCommand } as never);

    expect(registerCommand).toHaveBeenCalledWith(
      "mgood:init",
      expect.objectContaining({ description: expect.any(String), handler: expect.any(Function) }),
    );
  });
});
