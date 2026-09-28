import { beforeEach, describe, expect, it, vi } from "vitest";

import { markAsListened, removeFromList } from "./actions";

const mocks = vi.hoisted(() => ({
  markListened: vi.fn(),
  removeEntry: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/entries", () => ({
  markListened: mocks.markListened,
  removeEntry: mocks.removeEntry,
}));

const id = "0b6f2a4e-3c1d-4e5f-8a9b-1c2d3e4f5a6b";

beforeEach(() => {
  vi.clearAllMocks();
});

describe.each([
  ["markAsListened", markAsListened, mocks.markListened],
  ["removeFromList", removeFromList, mocks.removeEntry],
] as const)("%s", (_name, action, helper) => {
  it("succeeds and refreshes both lists", async () => {
    helper.mockResolvedValue(true);
    await expect(action(id)).resolves.toEqual({ status: "ok" });
    expect(helper).toHaveBeenCalledWith(expect.anything(), id);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/want-to-listen");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/listened");
  });

  it("reports an error when the entry is gone (or not the user's)", async () => {
    helper.mockResolvedValue(false);
    await expect(action(id)).resolves.toMatchObject({ status: "error" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(["", "not-a-uuid", 42, null])("rejects invalid id %j", async (bad) => {
    await expect(action(bad)).resolves.toMatchObject({ status: "error" });
    expect(helper).not.toHaveBeenCalled();
  });
});
