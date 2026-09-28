import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListEntry } from "@/lib/supabase/entries";

import { ListView } from "./list-view";

const actions = vi.hoisted(() => ({ markAsListened: vi.fn(), removeFromList: vi.fn() }));
vi.mock("@/lib/lists/actions", () => actions);
vi.mock("next/navigation", () => ({ usePathname: () => "/want-to-listen" }));

function entry(id: string, name: string, artist: string, releaseDate: string, addedAt: string): ListEntry {
  return {
    id,
    status: "want_to_listen",
    addedAt,
    listenedAt: null,
    album: { id: `album-${id}`, name, artist, coverUrl: null, releaseDate, storeUrl: null },
  };
}

const entries = [
  entry("1", "folklore", "Taylor Swift", "2020-07-24", "2026-09-02T00:00:00Z"),
  entry("2", "Back to Black", "Amy Winehouse", "2006-10-27", "2026-09-01T00:00:00Z"),
  entry("3", "Isolation", "Kali Uchis", "2018-04-06", "2026-09-03T00:00:00Z"),
];
const defaults = { sort: "added", dir: "desc", q: "" } as const;

function renderList(props: Partial<Parameters<typeof ListView>[0]> = {}) {
  render(
    <ListView title="Want to Listen" status="want_to_listen" entries={entries} initialParams={defaults} {...props} />,
  );
  return userEvent.setup();
}

function titles() {
  const list = screen.getByRole("list", { name: "Want to Listen" });
  return within(list)
    .getAllByRole("button")
    .map((b) => b.querySelector(".font-semibold")?.textContent);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/want-to-listen");
});

describe("ListView", () => {
  it("shows the count and newest-first order by default", () => {
    renderList();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Want to Listen (3)");
    expect(titles()).toEqual(["Isolation", "folklore", "Back to Black"]);
  });

  it("sorts by title and reverses when tapped again", async () => {
    const user = renderList();
    await user.click(screen.getByRole("button", { name: "Sort" }));
    const menu = screen.getByRole("group", { name: "Sort by" });

    await user.click(within(menu).getByRole("button", { name: /^title/i }));
    expect(titles()).toEqual(["Back to Black", "folklore", "Isolation"]);
    expect(window.location.search).toBe("?sort=title&dir=asc");

    await user.click(within(menu).getByRole("button", { name: /^title/i }));
    expect(titles()).toEqual(["Isolation", "folklore", "Back to Black"]);
    expect(within(menu).getByRole("button", { name: /^title/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters by title or artist and keeps the count of the whole list", async () => {
    const user = renderList();
    await user.type(screen.getByRole("searchbox", { name: "Filter Want to Listen" }), "amy");
    expect(titles()).toEqual(["Back to Black"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("(3)");
    expect(window.location.search).toContain("q=amy");
  });

  it("says when nothing matches the filter", async () => {
    const user = renderList();
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No albums match “zzz”.")).toBeInTheDocument();
  });

  it("starts from the params in the URL", () => {
    renderList({ initialParams: { sort: "release", dir: "asc", q: "" } });
    expect(titles()).toEqual(["Back to Black", "Isolation", "folklore"]);
  });

  it("links empty Want to Listen to search, without sort or filter controls", () => {
    renderList({ entries: [] });
    expect(screen.getByRole("link", { name: /search for albums/i })).toHaveAttribute("href", "/search");
    expect(screen.queryByRole("button", { name: "Sort" })).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("marks an album as listened from its detail view", async () => {
    actions.markAsListened.mockResolvedValue({ status: "ok" });
    const user = renderList();
    await user.click(screen.getByRole("button", { name: /Back to Black/ }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /mark as listened/i }));
    expect(actions.markAsListened).toHaveBeenCalledWith("2");
  });

  it("shows an action error in the dialog", async () => {
    actions.removeFromList.mockResolvedValue({ status: "error", message: "That album isn't in your lists anymore." });
    const user = renderList();
    await user.click(screen.getByRole("button", { name: /Back to Black/ }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /remove/i }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("isn't in your lists anymore");
  });

  it("closes the detail view once the entry leaves the list", async () => {
    const user = userEvent.setup();
    const props = { title: "Want to Listen", status: "want_to_listen", initialParams: defaults } as const;
    const { rerender } = render(<ListView {...props} entries={entries} />);
    await user.click(screen.getByRole("button", { name: /Back to Black/ }));
    await screen.findByRole("dialog");

    // What the server revalidation does after "Mark as listened" succeeds
    rerender(<ListView {...props} entries={entries.filter((e) => e.id !== "2")} />);
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("(2)");
  });
});
