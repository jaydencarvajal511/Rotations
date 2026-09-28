import { describe, expect, it } from "vitest";

import { filterEntries, nextSort, parseListParams, sortEntries, type SortableEntry } from "./sort";

function entry(
  id: string,
  name: string,
  artist: string,
  releaseDate: string | null,
  addedAt: string,
  listenedAt: string | null = null,
): SortableEntry {
  return { id, addedAt, listenedAt, album: { name, artist, releaseDate } };
}

const entries = [
  entry("a", "folklore", "Taylor Swift", "2020-07-24", "2026-01-03T00:00:00Z"),
  entry("b", "Back to Black", "Amy Winehouse", "2006-10-27", "2026-01-01T00:00:00Z"),
  entry("c", "Isolation", "Kali Uchis", null, "2026-01-02T00:00:00Z"),
  entry("d", "Élan", "Ágnes", "1999-01-01", "2026-01-04T00:00:00Z"),
];
const ids = (list: SortableEntry[]) => list.map((e) => e.id);

describe("sortEntries", () => {
  it("orders by date added, newest first by default", () => {
    expect(ids(sortEntries(entries, "added", "desc"))).toEqual(["d", "a", "c", "b"]);
  });

  it("uses listened_at for order made once an album is listened", () => {
    const listened = [
      entry("x", "X", "A", null, "2026-01-01T00:00:00Z", "2026-03-01T00:00:00Z"),
      entry("y", "Y", "A", null, "2026-02-01T00:00:00Z", "2026-02-15T00:00:00Z"),
    ];
    expect(ids(sortEntries(listened, "added", "desc"))).toEqual(["x", "y"]);
  });

  it("sorts titles case- and accent-insensitively", () => {
    expect(ids(sortEntries(entries, "title", "asc"))).toEqual(["b", "d", "a", "c"]);
    expect(ids(sortEntries(entries, "title", "desc"))).toEqual(["c", "a", "d", "b"]);
  });

  it("sorts by artist", () => {
    expect(ids(sortEntries(entries, "artist", "asc"))).toEqual(["d", "b", "c", "a"]);
  });

  it("keeps unknown release dates last in both directions", () => {
    expect(ids(sortEntries(entries, "release", "desc"))).toEqual(["a", "b", "d", "c"]);
    expect(ids(sortEntries(entries, "release", "asc"))).toEqual(["d", "b", "a", "c"]);
  });

  it("does not mutate the input", () => {
    const copy = [...entries];
    sortEntries(entries, "title", "asc");
    expect(entries).toEqual(copy);
  });
});

describe("filterEntries", () => {
  it("matches title or artist, ignoring case", () => {
    expect(ids(filterEntries(entries, "AMY"))).toEqual(["b"]);
    expect(ids(filterEntries(entries, "folk"))).toEqual(["a"]);
  });

  it("ignores accents in both query and data", () => {
    expect(ids(filterEntries(entries, "agnes"))).toEqual(["d"]);
    expect(ids(filterEntries(entries, "élan"))).toEqual(["d"]);
  });

  it("requires every word to match", () => {
    expect(ids(filterEntries(entries, "black amy"))).toEqual(["b"]);
    expect(ids(filterEntries(entries, "black taylor"))).toEqual([]);
  });

  it("returns everything for a blank query", () => {
    expect(filterEntries(entries, "   ")).toBe(entries);
  });
});

describe("parseListParams", () => {
  it("defaults to order made, newest first", () => {
    expect(parseListParams({})).toEqual({ sort: "added", dir: "desc", q: "" });
  });

  it("uses the sort's default direction when none is given", () => {
    expect(parseListParams({ sort: "title" })).toEqual({ sort: "title", dir: "asc", q: "" });
  });

  it("falls back on invalid values instead of throwing", () => {
    expect(parseListParams({ sort: "rating", dir: "sideways", q: "x".repeat(500) })).toEqual({
      sort: "added",
      dir: "desc",
      q: "",
    });
  });

  it("takes the first value of repeated params", () => {
    expect(parseListParams({ sort: ["artist", "title"], q: ["amy"] })).toMatchObject({
      sort: "artist",
      q: "amy",
    });
  });
});

describe("nextSort", () => {
  it("flips direction when tapping the active sort", () => {
    expect(nextSort({ sort: "title", dir: "asc", q: "" }, "title")).toEqual({ sort: "title", dir: "desc" });
  });

  it("resets to the default direction for a new sort", () => {
    expect(nextSort({ sort: "title", dir: "desc", q: "" }, "release")).toEqual({
      sort: "release",
      dir: "desc",
    });
  });
});
