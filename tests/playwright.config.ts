import { defineConfig, devices } from "@playwright/test";

// NixOS note: @playwright/test is pinned to EXACTLY 1.59.1 because the browsers
// come from nixpkgs `playwright-driver.browsers` (shell.nix), which ships
// chromium-1217. Newer Playwright looks for chromium-1243 and fails with
// "Executable doesn't exist". Do not bump without bumping the nixpkgs channel.
// Never run `npx playwright install` — those binaries cannot run on NixOS.

// BASE_URL = the Vercel deploy URL (see docs/setup-deploy.md), or localhost for dev.
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "pl-PL",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // AGENTS.md §7: layout must not break at 320px.
      name: "mobile-320",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 720 } },
    },
  ],
});
