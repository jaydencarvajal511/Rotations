import { afterEach, describe, expect, it, vi } from "vitest";

import lookupFixture from "./__fixtures__/lookup-back-to-black.json";
import searchFixture from "./__fixtures__/search-back-to-black.json";
import { ItunesError, lookupAlbum, MAX_TERM_LENGTH, searchAlbums } from "./client";

function mockFetch(body: unknown, init: ResponseInit = { status: 200 }) {
  const fetchMock = vi.fn(async () => Response.json(body, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof mockFetch>): URL {
  const [url] = fetchMock.mock.calls[0] as unknown as [URL];
  return url;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchAlbums", () => {
  it("queries albums only and returns summaries", async () => {
    const fetchMock = mockFetch(searchFixture);
    const albums = await searchAlbums("  back to black ");

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("term")).toBe("back to black");
    expect(url.searchParams.get("entity")).toBe("album");
    expect(url.searchParams.get("media")).toBe("music");
    expect(albums.map((a) => a.id)).toEqual(["1445278541", "1440856219", "1843311022"]);
  });

  it("skips the network for a blank term", async () => {
    const fetchMock = mockFetch(searchFixture);
    await expect(searchAlbums("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps the term length", async () => {
    const fetchMock = mockFetch(searchFixture);
    await searchAlbums("a".repeat(500));
    expect(requestedUrl(fetchMock).searchParams.get("term")).toHaveLength(MAX_TERM_LENGTH);
  });

  it("throws ItunesError on a non-OK response (e.g. rate limited)", async () => {
    mockFetch({}, { status: 403 });
    await expect(searchAlbums("x")).rejects.toMatchObject({ name: "ItunesError", status: 403 });
    await expect(searchAlbums("x")).rejects.toBeInstanceOf(ItunesError);
  });
});

describe("lookupAlbum", () => {
  it("returns the album for a valid id", async () => {
    mockFetch(lookupFixture);
    await expect(lookupAlbum("1440856219")).resolves.toMatchObject({
      id: "1440856219",
      name: "Back to Black",
    });
  });

  it("returns null when the id isn't an album (e.g. an artist id)", async () => {
    mockFetch({ resultCount: 1, results: [{ wrapperType: "artist", artistId: 1 }] });
    await expect(lookupAlbum("1")).resolves.toBeNull();
  });

  it.each(["", "abc", "123abc", "1".repeat(21), "../search"])(
    "rejects malformed id %j without calling the API",
    async (id) => {
      const fetchMock = mockFetch(lookupFixture);
      await expect(lookupAlbum(id)).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
