import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

vi.mock("@/lib/auth/actions", () => ({ signInWithGoogle: vi.fn() }));

async function renderLogin(searchParams: Record<string, string>) {
  render(await LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve(searchParams) }));
}

describe("LoginPage", () => {
  it("shows the sign-in button and no error by default", async () => {
    await renderLogin({});
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("forwards a safe next path to the sign-in action", async () => {
    await renderLogin({ next: "/listened" });
    expect(document.querySelector('input[name="next"]')).toHaveValue("/listened");
  });

  it("drops an off-site next path", async () => {
    await renderLogin({ next: "https://evil.com" });
    expect(document.querySelector('input[name="next"]')).toHaveValue("/");
  });

  it("shows an error after a failed sign-in", async () => {
    await renderLogin({ error: "auth" });
    expect(screen.getByRole("alert")).toHaveTextContent(/didn.t work/i);
  });
});
