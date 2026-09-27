import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./page";

vi.mock("@/lib/auth/actions", () => ({ signOut: vi.fn() }));

describe("Home", () => {
  it("renders the app name", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Rotations" }),
    ).toBeInTheDocument();
  });
});
