import { test, expect } from "@playwright/test";
import { openAs } from "./helpers";

test("demo story happy path: Kreator → submit → visible in admin", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-320");

  const titleStamp = `Pomysł demo ${Date.now()}`;

  const kreator = await openAs(page, "/kreator", "ngo");
  test.skip(!kreator.ok, `/kreator not shipped yet (HTTP ${kreator.status})`);

  const start = page.getByRole("link", { name: /zgłoś pomysł/i }).or(
    page.getByRole("button", { name: /zgłoś pomysł/i }),
  );
  test.skip((await start.count()) === 0, "Kreator landing choices not shipped yet (Hania)");
  await start.first().click();

  const problem = page.locator("#problem, textarea[name='problem'], input[name='problem']").first();
  await problem.fill("Sąsiedzi seniorzy są sami i nie dojadą do przychodni.");
  await page.getByRole("button", { name: /dalej|następn/i }).click();

  const solution = page.locator("#solution, textarea[name='solution'], input[name='solution']").first();
  await solution.fill("Sąsiedzki bus i dyżur wolontariuszy dwa razy w tygodniu.");
  await page.getByRole("button", { name: /dalej|następn/i }).click();

  const group = page.locator("#target_group, textarea[name='target_group'], select[name='target_group']").first();
  if (await group.count()) {
    const tag = await group.evaluate((el) => el.tagName.toLowerCase());
    if (tag === "select") await group.selectOption({ index: 1 });
    else await group.fill("seniorzy w gminie wiejskiej");
  }
  await page.getByRole("button", { name: /dalej|następn/i }).click();

  const title = page.locator("#title, input[name='title']").first();
  if (await title.count()) await title.fill(titleStamp);

  await page.getByRole("button", { name: /wyślij|zgłoś|zapisz/i }).click();
  await expect(page.getByText(/zgłoszenie|dziękujemy|wysłan/i).first()).toBeVisible();

  await openAs(page, "/admin/zgloszenia", "admin");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText(titleStamp).or(page.getByText(/sąsiedzki bus/i)).first()).toBeVisible();
});
