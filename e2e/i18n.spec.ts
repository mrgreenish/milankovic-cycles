import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("English stays at the root and /en redirects there", async ({ page }) => {
  await page.goto("/en/about");
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Why I built this" }),
  ).toBeVisible();
});

test("Dutch and Serbian pages are served under their own prefix", async ({
  page,
}) => {
  await page.goto("/nl");
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.getByRole("heading", { name: "Waarom komen en gaan ijstijden?" }),
  ).toBeVisible();

  await page.goto("/sr/learn/precession");
  await expect(page.locator("html")).toHaveAttribute("lang", "sr-Latn");
  await expect(
    page.getByRole("heading", { name: "Kako precesija pomera godišnja doba" }),
  ).toBeVisible();
  const alternates = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((links) =>
      links.map((link) => [
        link.getAttribute("hreflang"),
        link.getAttribute("href"),
      ]),
    );
  expect(alternates).toEqual(
    expect.arrayContaining([
      ["en", "https://milankovitchcycles.com/learn/precession"],
      ["nl", "https://milankovitchcycles.com/nl/learn/precession"],
      ["sr-Latn", "https://milankovitchcycles.com/sr/learn/precession"],
    ]),
  );
});

test("the language picker keeps the page, settings and hash", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lab?t=-21");
  await page.locator(".lang-menu summary").click();
  await page.getByRole("link", { name: /Nederlands/ }).first().click();
  await expect(page).toHaveURL(/\/nl\/lab\?t=-21/);
  await expect(page.getByRole("heading", { name: "Baanlab" })).toBeVisible();

  // Back to English through the footer, which drops the prefix again.
  await page
    .getByRole("group", { name: "Taal" })
    .last()
    .getByRole("link", { name: "English" })
    .click();
  await expect(page).toHaveURL(/:\d+\/lab\?t=-21/);
  await expect(page.getByRole("heading", { name: "Orbital lab" })).toBeVisible();
});

test("the Dutch tour works end to end", async ({ page }) => {
  await page.goto("/nl");
  await page.getByRole("link", { name: "Start de rondleiding" }).click();
  await expect(page).toHaveURL(/#big-idea$/);
  await expect(
    page.getByRole("heading", { name: "De zomer bepaalt of ijs groeit" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "21.000 jaar geleden" }).click();
  await expect(
    page.getByText("IJskappen bedekten Canada en Noord-Europa."),
  ).toBeVisible();
});

test("the Serbian lab keeps its prefix while settings change", async ({
  page,
}) => {
  await page.goto("/sr/lab");
  await expect(
    page.getByRole("heading", { name: "Orbitalna laboratorija" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Najmanji nagib · 22,1°" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sr\/lab\?e=.*o=22\.1000/);
  await expect(page.getByText("Sunčeva svetlost usred leta").first()).toBeVisible();
  // Links out of the lab stay in the language.
  await page.getByRole("link", { name: "Podaci La2004 ↗" }).click();
  await expect(page).toHaveURL(/\/sr\/sources$/);
});

test("an unknown address returns 404", async ({ request }) => {
  expect((await request.get("/nl/no-such-page")).status()).toBe(404);
  expect((await request.get("/no-such-page")).status()).toBe(404);
});

for (const path of ["/nl", "/sr", "/nl/lab", "/sr/faq", "/nl/learn/obliquity"]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
  });
}
