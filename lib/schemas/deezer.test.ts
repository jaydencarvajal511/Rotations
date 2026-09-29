import { describe, expect, it } from "vitest";

import albumFixture from "@/lib/deezer/__fixtures__/album-back-to-black.json";
import searchFixture from "@/lib/deezer/__fixtures__/search-back-to-black.json";

import { albumSummarySchema } from "./album";
import { deezerAlbumSchema, parseDeezerSearch, toAlbumSummary, toReleaseDate } from "./deezer";

describe("parseDeezerSearch", () => {
  it("parses a real search response", () => {
    const albums = parseDeezerSearch(searchFixture);
    expect(albums).toHaveLength(3);
    expect(albums[0]).toMatchObject({ id: 217795, title: "Back To Black", artist: { name: "Amy Winehouse" } });
  });

  it("drops malformed results instead of failing", () => {
    const albums = parseDeezerSearch({
      data: [{ id: "nope", title: "X" }, { id: 1, title: "", artist: { name: "Y" } }, searchFixture.data[0]],
      total: 3,
    });
    expect(albums.map((a) => a.id)).toEqual([217795]);
  });

  it("rejects an error payload", () => {
    expect(() => parseDeezerSearch({ error: { type: "Exception", message: "Quota limit exceeded", code: 4 } })).toThrow();
  });
});

describe("toAlbumSummary", () => {
  it("maps a search result (no release date) to a valid album", () => {
    const [album] = parseDeezerSearch(searchFixture);
    const summary = toAlbumSummary(album!);
    expect(summary).toEqual({
      id: "217795",
      name: "Back To Black",
      artist: "Amy Winehouse",
      coverUrl: expect.stringMatching(/^https:\/\/cdn-images\.dzcdn\.net\/images\/cover\/.+1000x1000/),
      releaseDate: null,
      storeUrl: "https://www.deezer.com/album/217795",
    });
    expect(albumSummarySchema.safeParse(summary).success).toBe(true);
  });

  it("includes the release date from the album endpoint", () => {
    const summary = toAlbumSummary(deezerAlbumSchema.parse(albumFixture));
    expect(summary.releaseDate).toBe("2006-10-30");
  });

  it("falls back to a built link and smaller cover when fields are missing", () => {
    const summary = toAlbumSummary({
      id: 5,
      title: "T",
      artist: { name: "A" },
      cover_big: "https://cdn-images.dzcdn.net/images/cover/x/500x500.jpg",
    });
    expect(summary).toMatchObject({
      coverUrl: "https://cdn-images.dzcdn.net/images/cover/x/500x500.jpg",
      storeUrl: "https://www.deezer.com/album/5",
    });
  });
});

describe("toReleaseDate", () => {
  it.each([
    ["2006-10-30", "2006-10-30"],
    ["0000-00-00", null],
    ["2006-00-00", null],
    ["2006", null],
    ["", null],
    [undefined, null],
  ])("%s → %s", (input, expected) => {
    expect(toReleaseDate(input)).toBe(expected);
  });
});
