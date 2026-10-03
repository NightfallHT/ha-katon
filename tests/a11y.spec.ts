import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import {
  AXE_TAGS,
  applyMode,
  assertNoHorizontalScroll,
  firstLibraryPath,
  openAs,
  type A11yMode,
} from "./helpers";

const STATIC_ROUTES = [
  "/",
  "/dopasuj",
  "/biblioteka",
  "/wyzwania",
  "/materialy",
  "/kreator",
  "/kreator/fiszka",
  "/kontakt",
  "/moje-zgloszenia",
  "/middleman",
  "/admin",
  "/admin/zgloszenia",
  "/admin/trendy",
] as const;

const MODES: A11yMode[] = ["default", "high", "font150"];

const KEY_PAGES_320 = [
  "/",
  "/dopasuj",
  "/biblioteka",
  "/wyzwania",
  "/materialy",
  "/kreator",
  "/kreator/grant",
  "/kreator/potwierdzenie",
  "/admin",
  "/admin/trendy",
];

async function runAxe(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = result.violations
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
    .join("\n");
  expect(result.violations, summary || "axe violations").toEqual([]);
}

test.describe("axe WCAG 2.1 AA, three a11y modes", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    void browserName;
    test.skip(testInfo.project.name === "mobile-320");
  });

  for (const route of STATIC_ROUTES) {
    for (const mode of MODES) {
      test(`${route} [${mode}]`, async ({ page }) => {
        const { ok, status } = await openAs(page, route);
        test.skip(!ok, `${route} not shipped yet (HTTP ${status})`);
        await applyMode(page, mode);
        await runAxe(page);
      });
    }
  }

  for (const mode of MODES) {
    test(`/biblioteka/[id] [${mode}]`, async ({ page }) => {
      const detail = await firstLibraryPath(page);
      test.skip(!detail, "no innovation card link on /biblioteka yet");
      await openAs(page, detail!, "mieszkaniec");
      await applyMode(page, mode);
      await runAxe(page);
    });
  }
});

test.describe("viewport 320px — no horizontal scroll", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    void browserName;
    test.skip(testInfo.project.name === "desktop");
  });

  for (const route of KEY_PAGES_320) {
    test(route, async ({ page }) => {
      const { ok, status } = await openAs(page, route);
      test.skip(!ok, `${route} not shipped yet (HTTP ${status})`);
      await assertNoHorizontalScroll(page);
    });
  }
});
