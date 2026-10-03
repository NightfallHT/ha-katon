import { test, expect } from "@playwright/test";
import { openAs } from "./helpers";

const PROBLEM =
  "Słabo widzę. Chcę wiedzieć, z jakich innowacji w Małopolsce mogę skorzystać.";

test.describe("keyboard only", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    void browserName;
    test.skip(testInfo.project.name === "mobile-320");
  });

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
    const heading = page.locator("h1#wyniki");
    await expect(heading).toBeVisible({ timeout: 25_000 });
    await expect(heading).toBeFocused();
  });

  test("example prompt fills the search and selects the first gap", async ({ page }) => {
    await openAs(page, "/", "mieszkaniec");
    await page
      .getByRole("button", { name: /Szukam wsparcia dla/ })
      .click();
    const field = page.locator("#problem");
    await expect(field).toHaveValue(/_____/);
    const selected = await field.evaluate((element) => {
      const textarea = element as HTMLTextAreaElement;
      return textarea.value.slice(
        textarea.selectionStart,
        textarea.selectionEnd,
      );
    });
    expect(selected).toBe("_____");
  });

  test("help-bot dialog opens, traps focus, closes with Escape", async ({ page }) => {
    const biblioteka = await openAs(page, "/biblioteka", "mieszkaniec");
    test.skip(!biblioteka.ok, "/biblioteka not shipped yet");
    const trigger = page.getByRole("button", { name: /pomoc/i });
    test.skip((await trigger.count()) === 0, "HelpBot not on this page yet (Jakub / ResourceNav)");
    await trigger.first().click();
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
    await expect(trigger.first()).toBeFocused();
  });

  test("biblioteka shortcut filters seniors", async ({ page }) => {
    const biblioteka = await openAs(page, "/biblioteka", "mieszkaniec");
    test.skip(!biblioteka.ok, "/biblioteka not shipped yet");
    const chip = page.getByRole("button", { name: "Seniorzy" });
    test.skip((await chip.count()) === 0, "shortcut chips not on /biblioteka");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/znaleziono/i).first()).toBeVisible();
  });

  test("confirmation page shows parcel tracker", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "hubmi-last-submission",
        JSON.stringify({ type: "idea", title: "Sąsiedzki bus" }),
      );
    });
    const pageRes = await openAs(page, "/kreator/potwierdzenie", "ngo");
    test.skip(!pageRes.ok, "/kreator/potwierdzenie not shipped yet");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const step = page.getByText("1. Wysłane");
    await expect(step).toBeVisible();
  });
});
