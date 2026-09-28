import { expect, test } from "./fixtures";

// Fake ids outside iTunes' numeric range so they can't collide with real cached albums
const albums = [
  { id: "900000000000000001", name: "Back to Black", artist: "Amy Winehouse", release_date: "2006-10-27" },
  { id: "900000000000000002", name: "folklore", artist: "Taylor Swift", release_date: "2020-07-24" },
  { id: "900000000000000003", name: "Isolation", artist: "Kali Uchis", release_date: "2018-04-06" },
];

function listTitles(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("list", { name }).getByRole("listitem").locator(".font-semibold").allTextContents();
}

test("home opens Want to Listen with the bottom nav", async ({ page, user }) => {
  void user;
  await page.goto("/");
  await expect(page).toHaveURL(/\/want-to-listen$/);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Want to Listen" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Nothing queued up yet.")).toBeVisible();
});

test("sorts and filters Want to Listen, and keeps it in the URL", async ({ page, seed }) => {
  await seed(albums.map((a) => ({ ...a, status: "want_to_listen" })));
  await page.goto("/want-to-listen");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Want to Listen (3)");
  expect(await listTitles(page, "Want to Listen")).toEqual(["Isolation", "folklore", "Back to Black"]);

  await page.getByRole("button", { name: "Sort" }).click();
  const menu = page.getByRole("group", { name: "Sort by" });
  await menu.getByRole("button", { name: /^Title/ }).click();
  expect(await listTitles(page, "Want to Listen")).toEqual(["Back to Black", "folklore", "Isolation"]);
  await menu.getByRole("button", { name: /^Title/ }).click();
  expect(await listTitles(page, "Want to Listen")).toEqual(["Isolation", "folklore", "Back to Black"]);
  await expect(page).toHaveURL(/sort=title&dir=desc/);

  await page.getByRole("searchbox", { name: "Filter Want to Listen" }).fill("swift");
  expect(await listTitles(page, "Want to Listen")).toEqual(["folklore"]);

  // Sort and filter survive a reload
  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Filter Want to Listen" })).toHaveValue("swift");
  expect(await listTitles(page, "Want to Listen")).toEqual(["folklore"]);
});

test("moves an album to Listened", async ({ page, seed }) => {
  await seed(albums.map((a) => ({ ...a, status: "want_to_listen" })));
  await page.goto("/want-to-listen");

  await page.getByRole("button", { name: /Back to Black/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Back to Black" })).toBeVisible();
  await dialog.getByRole("button", { name: "Mark as listened" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Want to Listen (2)");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Listened" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Listened (1)");
  await page.getByRole("button", { name: /Back to Black/ }).click();
  await expect(page.getByRole("dialog").getByText(/^Listened /)).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Mark as listened" })).toHaveCount(0);
});

test("removes an album from a list", async ({ page, seed }) => {
  await seed([{ ...albums[0]!, status: "listened" }]);
  await page.goto("/listened");

  await page.getByRole("button", { name: /Back to Black/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("No albums listened to yet.", { exact: false })).toBeVisible();
});
