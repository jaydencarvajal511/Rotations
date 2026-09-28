import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "./database.types";
import { addWantToListen, getEntryStatuses } from "./entries";

type Result = { data?: unknown; error: { code: string; message: string } | null };

/** Minimal stand-in for the query-builder chain these helpers use. */
function fakeClient(result: Result) {
  const builder = {
    insert: vi.fn(async () => result),
    select: vi.fn(() => builder),
    in: vi.fn(async () => result),
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
