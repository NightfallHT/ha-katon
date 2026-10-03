import { test, expect } from "@playwright/test";
import { openAs } from "./helpers";

const PROBLEM =
  "Moi starsi sąsiedzi są sami i nie mają jak dojechać do lekarza. Mieszkamy na wsi.";

test.describe("keyboard only", () => {
  test.skip(({ }, testInfo) => testInfo.project.name === "mobile-320");

  test("skip link jumps to main", async ({ page }) => {
    await openAs(page, "/", "mieszkaniec");
    await page.keyboard.press("Tab");
    const skip = page.locator('a[href="#main"]');
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    const main = page.locator("#main");
    await expect(main).toBeVisible();
    await expect(
      main,
      "Give #main tabIndex={-1} and focus it (or let the skip link move focus).",
    ).toBeFocused();
  });

  test("home → type problem → submit → results heading focused", async ({ page }) => {
    await openAs(page, "/", "mieszkaniec");
    const field = page.locator("#problem, textarea[name='q'], textarea[name='query']").first();
    test.skip(
      (await field.count()) === 0,
      "home search form not shipped yet (Ola task 3)",
    );
    await field.focus();
    await page.keyboard.type(PROBLEM);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForURL(/dopasuj/);
    const heading = page.locator("h1#wyniki, h1").first();
    await expect(heading).toBeFocused();
  });

  test("help-bot dialog opens, traps focus, closes with Escape", async ({ page }) => {
    await openAs(page, "/", "mieszkaniec");
    const trigger = page.getByRole("button", { name: /pomoc/i });
    test.skip((await trigger.count()) === 0, "HelpBot not shipped yet (Jakub)");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const focusable = dialog.locator(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);

    const first = focusable.first();
    const last = focusable.nth(count - 1);
    await last.focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
