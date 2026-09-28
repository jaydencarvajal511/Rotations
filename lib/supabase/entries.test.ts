import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "./database.types";
import { addWantToListen, getEntryStatuses, listEntries, markListened, removeEntry } from "./entries";

type Result = { data?: unknown; error: { code: string; message: string } | null };

/** Minimal stand-in for the query-builder chain these helpers use. */
function fakeClient(result: Result) {
  // Chain methods return the builder, and awaiting the builder resolves to `result`
  const builder = {
    insert: vi.fn(async () => result),
    in: vi.fn(async () => result),
    select: vi.fn((): typeof builder => builder),
    eq: vi.fn((): typeof builder => builder),
    order: vi.fn((): typeof builder => builder),
    update: vi.fn((): typeof builder => builder),
    delete: vi.fn((): typeof builder => builder),
    then<A, B = never>(
      resolve?: ((value: Result) => A | PromiseLike<A>) | null,
      reject?: ((reason: unknown) => B | PromiseLike<B>) | null,
    ): Promise<A | B> {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  const client = { from: vi.fn(() => builder) };
  return { client: client as unknown as SupabaseClient<Database>, builder };
}

describe("addWantToListen", () => {
  it("inserts a want_to_listen row", async () => {
    const { client, builder } = fakeClient({ error: null });
    await expect(addWantToListen(client, "u1", "42")).resolves.toEqual({ status: "added" });
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: "u1",
      album_id: "42",
      status: "want_to_listen",
    });
  });

  it("maps a unique violation to exists", async () => {
    const { client } = fakeClient({ error: { code: "23505", message: "duplicate" } });
    await expect(addWantToListen(client, "u1", "42")).resolves.toEqual({ status: "exists" });
  });

  it("rethrows other errors (e.g. RLS denial)", async () => {
    const { client } = fakeClient({ error: { code: "42501", message: "rls" } });
    await expect(addWantToListen(client, "u1", "42")).rejects.toMatchObject({ code: "42501" });
  });
});

describe("getEntryStatuses", () => {
  it("returns a map of album id to validated status", async () => {
    const { client } = fakeClient({
      data: [
        { album_id: "1", status: "listened" },
        { album_id: "2", status: "want_to_listen" },
      ],
      error: null,
    });
    await expect(getEntryStatuses(client, ["1", "2", "3"])).resolves.toEqual({
      "1": "listened",
      "2": "want_to_listen",
    });
  });

  it("skips the query for no ids", async () => {
    const { client } = fakeClient({ data: [], error: null });
    await expect(getEntryStatuses(client, [])).resolves.toEqual({});
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects an unexpected status from the database", async () => {
    const { client } = fakeClient({ data: [{ album_id: "1", status: "bogus" }], error: null });
    await expect(getEntryStatuses(client, ["1"])).rejects.toThrow();
  });
});

const row = {
  id: "0b6f2a4e-3c1d-4e5f-8a9b-1c2d3e4f5a6b",
  status: "want_to_listen",
  added_at: "2026-09-01T00:00:00Z",
  listened_at: null,
  albums: {
    id: "1440856219",
    name: "Back to Black",
    artist: "Amy Winehouse",
    cover_url: "https://is1-ssl.mzstatic.com/x/600x600bb.jpg",
    release_date: "2006-10-27",
  },
};

describe("listEntries", () => {
  it("maps joined rows to entries with an Apple Music link", async () => {
    const { client, builder } = fakeClient({ data: [row], error: null });
    const [entry] = await listEntries(client, "want_to_listen");
    expect(builder.eq).toHaveBeenCalledWith("status", "want_to_listen");
    expect(entry).toEqual({
      id: row.id,
      status: "want_to_listen",
      addedAt: row.added_at,
      listenedAt: null,
      album: {
        id: "1440856219",
        name: "Back to Black",
        artist: "Amy Winehouse",
        coverUrl: row.albums.cover_url,
        releaseDate: "2006-10-27",
        storeUrl: "https://music.apple.com/album/1440856219",
      },
    });
  });

  it("rejects rows missing their album join", async () => {
    const { client } = fakeClient({ data: [{ ...row, albums: null }], error: null });
    await expect(listEntries(client, "want_to_listen")).rejects.toThrow();
  });
});

describe("markListened", () => {
  it("sets status and listened_at, only for want_to_listen entries", async () => {
    const { client, builder } = fakeClient({ data: [{ id: row.id }], error: null });
    await expect(markListened(client, row.id)).resolves.toBe(true);
    expect(builder.update).toHaveBeenCalledWith({ status: "listened", listened_at: expect.any(String) });
    expect(builder.eq).toHaveBeenCalledWith("status", "want_to_listen");
  });

  it("returns false when nothing matched", async () => {
    const { client } = fakeClient({ data: [], error: null });
    await expect(markListened(client, row.id)).resolves.toBe(false);
  });
});

describe("removeEntry", () => {
  it("returns whether a row was deleted", async () => {
    await expect(removeEntry(fakeClient({ data: [{ id: row.id }], error: null }).client, row.id)).resolves.toBe(true);
    await expect(removeEntry(fakeClient({ data: [], error: null }).client, row.id)).resolves.toBe(false);
  });
});
