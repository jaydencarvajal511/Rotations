import { describe, expect, it } from "vitest";

import searchFixture from "@/lib/itunes/__fixtures__/search-back-to-black.json";

import { albumSummarySchema } from "./album";
import { parseItunesAlbums, toAlbumSummary, toReleaseDate, upscaleArtwork } from "./itunes";

describe("parseItunesAlbums", () => {
  it("parses a real search response", () => {
    const albums = parseItunesAlbums(searchFixture);
    expect(albums).toHaveLength(3);
    expect(albums[1]).toMatchObject({ collectionId: 1440856219, collectionName: "Back to Black" });
  });

  it("drops non-album and malformed results instead of failing", () => {
    const albums = parseItunesAlbums({
      resultCount: 3,
      results: [
        { wrapperType: "artist", artistId: 1, artistName: "Amy Winehouse" },
        { wrapperType: "collection", collectionId: "not-a-number", collectionName: "X", artistName: "Y" },
        searchFixture.results[0],
      ],
    });
    expect(albums.map((a) => a.collectionId)).toEqual([1445278541]);
  });

  it("rejects a response that isn't an iTunes payload", () => {
    expect(() => parseItunesAlbums({ error: "nope" })).toThrow();
  });
});

describe("toAlbumSummary", () => {
  it("maps to a valid catalog-agnostic album", () => {
    const [, album] = parseItunesAlbums(searchFixture);
    const summary = toAlbumSummary(album!);
    expect(summary).toEqual({
      id: "1440856219",
      name: "Back to Black",
      artist: "Amy Winehouse",
      coverUrl: expect.stringMatching(/\/600x600bb\.jpg$/),
      releaseDate: "2006-10-27",
      storeUrl: expect.stringContaining("music.apple.com"),
    });
    expect(albumSummarySchema.safeParse(summary).success).toBe(true);
  });

  it("tolerates missing artwork, date, and store link", () => {
    const summary = toAlbumSummary({
      wrapperType: "collection",
      collectionId: 1,
      collectionName: "Name",
      artistName: "Artist",
    });
    expect(summary).toMatchObject({ coverUrl: null, releaseDate: null, storeUrl: null });
  });
});

describe("upscaleArtwork", () => {
  it("leaves URLs without the size segment untouched", () => {
    expect(upscaleArtwork("https://example.com/cover.jpg")).toBe("https://example.com/cover.jpg");
  });
});

describe("toReleaseDate", () => {
  it.each([
    ["2006-10-27T07:00:00Z", "2006-10-27"],
    ["2007-01-01", "2007-01-01"],
    ["2007", null],
    ["", null],
    [undefined, null],
  ])("%s → %s", (input, expected) => {
    expect(toReleaseDate(input)).toBe(expected);
  });
});
