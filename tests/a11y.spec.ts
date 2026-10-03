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
  "/kontakt",
  "/moje-zgloszenia",
  "/middleman",
  "/admin",
  "/admin/zgloszenia",
  "/admin/trendy",
] as const;

const MODES: A11yMode[] = ["default", "high", "font150"];

const KEY_PAGES_320 = ["/", "/dopasuj", "/biblioteka", "/kreator", "/admin"];

async function runAxe(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = result.violations
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
    .join("\n");
  expect(result.violations, summary || "axe violations").toEqual([]);
}

test.describe("axe WCAG 2.1 AA, three a11y modes", () => {
  for (const route of STATIC_ROUTES) {
    for (const mode of MODES) {
      test(`${route} [${mode}]`, async ({ page }) => {
        await openAs(page, route);
        await applyMode(page, mode);
        await runAxe(page);
      });
    }
  }

  for (const mode of MODES) {
    test(`/biblioteka/[id] [${mode}]`, async ({ page }) => {
      const detail = await firstLibraryPath(page);
      await openAs(page, detail, "mieszkaniec");
      await applyMode(page, mode);
      await runAxe(page);
    });
  }
});

test.describe("viewport 320px — no horizontal scroll", () => {
  for (const route of KEY_PAGES_320) {
    test(route, async ({ page }) => {
      await openAs(page, route);
      await assertNoHorizontalScroll(page);
    });
  }
});
