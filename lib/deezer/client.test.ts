import { afterEach, describe, expect, it, vi } from "vitest";

import albumFixture from "./__fixtures__/album-back-to-black.json";
import searchFixture from "./__fixtures__/search-back-to-black.json";
import { CatalogError, lookupAlbum, MAX_TERM_LENGTH, searchAlbums } from "./client";

function mockFetch(body: unknown, init: ResponseInit = { status: 200 }) {
  const fetchMock = vi.fn(async () => Response.json(body, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof mockFetch>): URL {
  const [url] = fetchMock.mock.calls[0] as unknown as [URL];
  return url;
}

// Deezer returns these with HTTP 200
const quotaError = { error: { type: "Exception", message: "Quota limit exceeded", code: 4 } };
const notFound = { error: { type: "DataException", message: "no data", code: 800 } };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchAlbums", () => {
  it("searches albums and returns summaries", async () => {
    const fetchMock = mockFetch(searchFixture);
    const albums = await searchAlbums("  back to black ");

    const url = requestedUrl(fetchMock);
    expect(url.origin + url.pathname).toBe("https://api.deezer.com/search/album");
    expect(url.searchParams.get("q")).toBe("back to black");
    expect(albums.map((a) => a.id)).toEqual(searchFixture.data.map((d) => String(d.id)));
  });

  it("skips the network for a blank term", async () => {
    const fetchMock = mockFetch(searchFixture);
    await expect(searchAlbums("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps the term length", async () => {
    const fetchMock = mockFetch(searchFixture);
    await searchAlbums("a".repeat(500));
    expect(requestedUrl(fetchMock).searchParams.get("q")).toHaveLength(MAX_TERM_LENGTH);
  });

  it("throws CatalogError for an error body served with HTTP 200", async () => {
    mockFetch(quotaError);
    await expect(searchAlbums("x")).rejects.toMatchObject({ name: "CatalogError", code: 4 });
  });

  it("throws CatalogError on a non-OK HTTP status", async () => {
    mockFetch({}, { status: 503 });
    await expect(searchAlbums("x")).rejects.toBeInstanceOf(CatalogError);
  });
});

describe("lookupAlbum", () => {
  it("returns full details including the release date", async () => {
    const fetchMock = mockFetch(albumFixture);
    await expect(lookupAlbum("217795")).resolves.toMatchObject({
      id: "217795",
      name: "Back To Black",
      releaseDate: "2006-10-30",
    });
    expect(requestedUrl(fetchMock).pathname).toBe("/album/217795");
  });

  it("returns null for an unknown album", async () => {
    mockFetch(notFound);
    await expect(lookupAlbum("1")).resolves.toBeNull();
  });

  it("throws on other errors so callers can report an outage", async () => {
    mockFetch(quotaError);
    await expect(lookupAlbum("217795")).rejects.toMatchObject({ code: 4 });
  });

  it.each(["", "abc", "123abc", "1".repeat(21), "../search"])(
    "rejects malformed id %j without calling the API",
    async (id) => {
      const fetchMock = mockFetch(albumFixture);
      await expect(lookupAlbum(id)).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
