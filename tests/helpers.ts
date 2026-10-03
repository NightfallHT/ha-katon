import { expect, type Page } from "@playwright/test";

export type DemoRole = "mieszkaniec" | "ngo" | "gmina" | "ekspert" | "admin";
export type A11yMode = "default" | "high" | "font150";

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export const ROLE_BY_PATH: Record<string, DemoRole> = {
  "/": "mieszkaniec",
  "/dopasuj": "mieszkaniec",
  "/biblioteka": "mieszkaniec",
  "/wyzwania": "mieszkaniec",
  "/materialy": "mieszkaniec",
  "/kreator": "ngo",
  "/kontakt": "mieszkaniec",
  "/moje-zgloszenia": "ngo",
  "/middleman": "gmina",
  "/admin": "admin",
  "/admin/zgloszenia": "admin",
  "/admin/trendy": "admin",
};

export const DEMO_EMAIL: Record<DemoRole, string> = {
  mieszkaniec: "halina@demo.hubmi.pl",
  ngo: "anna.k@razem-blizej.demo",
  gmina: "wojt@gmina-demo.pl",
  ekspert: "ekspert@demo.hubmi.pl",
  admin: "rops@demo.hubmi.pl",
};

export async function openAs(page: Page, path: string, role?: DemoRole) {
  const resolvedRole = role ?? roleForPath(path);
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  const origin = new URL(base).origin;
  await page.context().addCookies([
    { name: "role", value: resolvedRole, url: origin, path: "/" },
    { name: "demo_email", value: DEMO_EMAIL[resolvedRole], url: origin, path: "/" },
  ]);
  await page.goto(path, { waitUntil: "networkidle" });
}

export function roleForPath(path: string): DemoRole {
  if (path.startsWith("/biblioteka/")) return "mieszkaniec";
  return ROLE_BY_PATH[path] ?? "mieszkaniec";
}

export async function applyMode(page: Page, mode: A11yMode) {
  const contrast = mode === "high" ? "high" : "";
  const font = mode === "font150" ? "150" : "";
  await page.evaluate(
    ({ contrast, font }) => {
      const html = document.documentElement;
      if (contrast) html.setAttribute("data-contrast", contrast);
      else html.removeAttribute("data-contrast");
      if (font) html.setAttribute("data-font", font);
      else html.removeAttribute("data-font");
      try {
        if (contrast) localStorage.setItem("contrast", contrast);
        else localStorage.removeItem("contrast");
        if (font) localStorage.setItem("font", font);
        else localStorage.removeItem("font");
      } catch {
        /* demo may run without storage */
      }
    },
    { contrast, font },
  );
}

export async function firstLibraryPath(page: Page): Promise<string> {
  await openAs(page, "/biblioteka", "mieszkaniec");
  const link = page.locator('a[href^="/biblioteka/"]').first();
  if (await link.count()) {
    const href = await link.getAttribute("href");
    if (href) return href;
  }
  return "/biblioteka/demo";
}

export async function assertNoHorizontalScroll(page: Page) {
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}
