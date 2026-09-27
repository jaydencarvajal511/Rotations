import { describe, expect, it } from "vitest";

import { isPublicPath, safeNextPath } from "./paths";

describe("isPublicPath", () => {
  it.each(["/login", "/auth/callback", "/~offline"])("allows %s", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/", "/listened", "/loginx", "/auth"])("protects %s", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/listened?sort=name")).toBe("/listened?sort=name");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "evil.com",
  ])("falls back to / for %s", (next) => {
    expect(safeNextPath(next)).toBe("/");
  });
});
