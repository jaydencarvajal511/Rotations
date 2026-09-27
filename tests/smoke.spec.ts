import { expect, test } from "@playwright/test";

test("signed-out visitors land on the sign-in page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2F$/);
  await expect(page).toHaveTitle("Sign in · Rotations");
  await expect(
    page.getByRole("heading", { level: 1, name: "Rotations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /sign in with google/i }),
  ).toBeVisible();
});

test("the requested page is preserved through sign-in", async ({ page }) => {
  await page.goto("/listened?sort=name");
  await expect(page).toHaveURL(/\/login\?next=%2Flistened%3Fsort%3Dname$/);
  await expect(page.locator('input[name="next"]')).toHaveValue("/listened?sort=name");
});

test("the offline page stays public", async ({ page }) => {
  await page.goto("/~offline");
  await expect(page).toHaveURL(/\/~offline$/);
});
