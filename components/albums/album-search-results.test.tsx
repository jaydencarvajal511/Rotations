import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AlbumSummary } from "@/lib/schemas/album";

import { AlbumSearchResults } from "./album-search-results";

const saveToWantToListen = vi.hoisted(() => vi.fn());
vi.mock("@/app/search/actions", () => ({ saveToWantToListen }));

const albums: AlbumSummary[] = [
  {
    id: "1",
    name: "Back to Black",
    artist: "Amy Winehouse",
    coverUrl: null,
    releaseDate: "2006-10-27",
    storeUrl: "https://music.apple.com/us/album/1",
  },
  {
    id: "2",
    name: "folklore",
    artist: "Taylor Swift",
    coverUrl: null,
    releaseDate: null,
    storeUrl: null,
  },
];

beforeEach(() => {
  saveToWantToListen.mockReset();
});

async function openAlbum(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: new RegExp(name, "i") }));
  return { user, dialog: await screen.findByRole("dialog") };
}

describe("AlbumSearchResults", () => {
  it("lists each result with title and artist", () => {
    render(<AlbumSearchResults albums={albums} initialStatuses={{}} />);
    const list = screen.getByRole("list", { name: "Search results" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("Amy Winehouse")).toBeInTheDocument();
  });

  it("opens a detail view with artist, year, and store link", async () => {
    render(<AlbumSearchResults albums={albums} initialStatuses={{}} />);
    const { dialog } = await openAlbum("Back to Black");
    expect(within(dialog).getByRole("heading", { name: "Back to Black" })).toBeInTheDocument();
    expect(within(dialog).getByText("2006")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /apple music/i })).toHaveAttribute(
      "href",
      "https://music.apple.com/us/album/1",
    );
  });

  it("hides the year and store link when unknown", async () => {
    render(<AlbumSearchResults albums={albums} initialStatuses={{}} />);
    const { dialog } = await openAlbum("folklore");
    expect(within(dialog).queryByText("•")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
  });

  it("marks albums already in a list instead of offering to add", async () => {
    render(<AlbumSearchResults albums={albums} initialStatuses={{ "1": "listened" }} />);
    const { dialog } = await openAlbum("Back to Black");
    expect(within(dialog).getByText("This album is already in rotation!")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /add to want to listen/i })).not.toBeInTheDocument();
  });

  it("saves and then remembers the album is in rotation", async () => {
    saveToWantToListen.mockResolvedValue({ status: "added" });
    render(<AlbumSearchResults albums={albums} initialStatuses={{}} />);
    const { user, dialog } = await openAlbum("Back to Black");

    await user.click(within(dialog).getByRole("button", { name: /add to want to listen/i }));
    expect(await within(dialog).findByText("Saved to Want to Listen")).toBeInTheDocument();
    expect(saveToWantToListen).toHaveBeenCalledWith("1");

    await user.keyboard("{Escape}");
    const reopened = await openAlbum("Back to Black");
    expect(within(reopened.dialog).getByText("This album is already in rotation!")).toBeInTheDocument();
  });

  it("shows the error and keeps the add button on failure", async () => {
    saveToWantToListen.mockResolvedValue({ status: "error", message: "Please sign in again." });
    render(<AlbumSearchResults albums={albums} initialStatuses={{}} />);
    const { user, dialog } = await openAlbum("Back to Black");

    await user.click(within(dialog).getByRole("button", { name: /add to want to listen/i }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Please sign in again.");
    expect(within(dialog).getByRole("button", { name: /add to want to listen/i })).toBeEnabled();
  });
});
