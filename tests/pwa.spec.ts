import { expect, test } from "@playwright/test";

test("serves an installable web app manifest", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = (await res.json()) as {
    name: string;
    display: string;
    icons: { sizes: string }[];
  };
  expect(manifest.name).toBe("Rotations");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i) => i.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
});

test("serves the service worker script", async ({ request }) => {
  const res = await request.get("/serwist/sw.js");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("javascript");
});
