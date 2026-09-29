import { beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogError } from "@/lib/catalog";
import type { AlbumSummary } from "@/lib/schemas/album";

import { getAlbumDetails, saveToWantToListen } from "./actions";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  lookupAlbum: vi.fn(),
  upsertAlbum: vi.fn(),
  getEntryStatuses: vi.fn(),
  addWantToListen: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mocks.getClaims } }),
}));
vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  lookupAlbum: mocks.lookupAlbum,
}));
vi.mock("@/lib/supabase/albums", () => ({ upsertAlbum: mocks.upsertAlbum }));
vi.mock("@/lib/supabase/entries", () => ({
  getEntryStatuses: mocks.getEntryStatuses,
  addWantToListen: mocks.addWantToListen,
}));

const album: AlbumSummary = {
  id: "1440856219",
  name: "Back to Black",
  artist: "Amy Winehouse",
  coverUrl: "https://example.com/600x600bb.jpg",
  releaseDate: "2006-10-27",
  storeUrl: "https://music.apple.com/us/album/1440856219",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
  mocks.getEntryStatuses.mockResolvedValue({});
  mocks.lookupAlbum.mockResolvedValue(album);
  mocks.addWantToListen.mockResolvedValue({ status: "added" });
});

describe("saveToWantToListen", () => {
  it("caches catalog metadata and adds the entry for the signed-in user", async () => {
    await expect(saveToWantToListen(album.id)).resolves.toEqual({ status: "added" });
    expect(mocks.lookupAlbum).toHaveBeenCalledWith(album.id);
    expect(mocks.upsertAlbum).toHaveBeenCalledWith(album);
    expect(mocks.addWantToListen).toHaveBeenCalledWith(expect.anything(), "user-1", album.id);
  });

  it.each([123, "", "abc", "1; drop table albums", { id: "1" }, null])(
    "rejects invalid id %j before touching anything",
    async (id) => {
      await expect(saveToWantToListen(id)).resolves.toMatchObject({ status: "error" });
      expect(mocks.getClaims).not.toHaveBeenCalled();
      expect(mocks.upsertAlbum).not.toHaveBeenCalled();
    },
  );

  it("refuses when signed out", async () => {
    mocks.getClaims.mockResolvedValue({ data: null });
    await expect(saveToWantToListen(album.id)).resolves.toEqual({
      status: "error",
      message: "Please sign in again.",
    });
    expect(mocks.upsertAlbum).not.toHaveBeenCalled();
  });

  it("short-circuits when the album is already in a list", async () => {
    mocks.getEntryStatuses.mockResolvedValue({ [album.id]: "listened" });
    await expect(saveToWantToListen(album.id)).resolves.toEqual({ status: "already_saved" });
    expect(mocks.lookupAlbum).not.toHaveBeenCalled();
  });

  it("reports already saved when a concurrent insert wins the race", async () => {
    mocks.addWantToListen.mockResolvedValue({ status: "exists" });
    await expect(saveToWantToListen(album.id)).resolves.toEqual({ status: "already_saved" });
  });

  it("never writes to the cache when the id isn't a catalog album", async () => {
    mocks.lookupAlbum.mockResolvedValue(null);
    await expect(saveToWantToListen(album.id)).resolves.toMatchObject({ status: "error" });
    expect(mocks.upsertAlbum).not.toHaveBeenCalled();
    expect(mocks.addWantToListen).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the catalog is unavailable", async () => {
    mocks.lookupAlbum.mockRejectedValue(new CatalogError("quota exceeded", 4));
    await expect(saveToWantToListen(album.id)).resolves.toMatchObject({
      status: "error",
      message: expect.stringMatching(/unavailable/),
    });
  });
});

describe("getAlbumDetails", () => {
  it("returns catalog details for a valid id", async () => {
    await expect(getAlbumDetails(album.id)).resolves.toEqual(album);
  });

  it("returns null for an invalid id without calling the catalog", async () => {
    await expect(getAlbumDetails("../x")).resolves.toBeNull();
    expect(mocks.lookupAlbum).not.toHaveBeenCalled();
  });

  it("returns null when the catalog is unavailable", async () => {
    mocks.lookupAlbum.mockRejectedValue(new CatalogError("quota exceeded", 4));
    await expect(getAlbumDetails(album.id)).resolves.toBeNull();
  });
});
