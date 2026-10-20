import { expect, test } from "./fixtures";

// Hits the real Deezer API (responses are cached by the app for a day)
test("finds an album and adds it to Want to Listen", async ({ page, user, admin }) => {
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Search albums" }).fill("back to black amy winehouse");
  await page.keyboard.press("Enter");

  const result = page.getByRole("button", { name: /^Back to Black\s*Amy Winehouse$/i }).first();
  await result.click();
  const dialog = page.getByRole("dialog");
  // Release year is fetched separately from the search results
  await expect(dialog.getByText("2006")).toBeVisible();
  await dialog.getByRole("button", { name: "Add to Want to Listen" }).click();
  await expect(dialog.getByText("Saved to Want to Listen")).toBeVisible();

  const { data } = await admin
    .from("listening_entries")
    .select("status, albums (name, artist)")
    .eq("user_id", user.id);
  expect(data).toEqual([{ status: "want_to_listen", albums: { name: "Back To Black", artist: "Amy Winehouse" } }]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Want to Listen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Want to Listen (1)");
});

test("adds an album straight to Listened from search", async ({ page, user, admin }) => {
  await page.goto("/search?q=back%20to%20black%20amy%20winehouse");

  await page.getByRole("button", { name: /^Back to Black\s*Amy Winehouse$/i }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Add to Listened" }).click();
  await expect(dialog.getByText("Saved to Listened")).toBeVisible();

  const { data } = await admin
    .from("listening_entries")
    .select("status, listened_at")
    .eq("user_id", user.id);
  expect(data).toEqual([{ status: "listened", listened_at: expect.any(String) }]);

  await page.keyboard.press("Escape");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Listened" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Listened (1)");
});
