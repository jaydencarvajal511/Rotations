import { defineConfig, devices } from "@playwright/test";

// dedicated port so e2e never attaches to an unrelated local server
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // 375px wide — the mobile-first baseline from CLAUDE.md
    { name: "mobile-safari", use: { ...devices["iPhone 13 Mini"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
