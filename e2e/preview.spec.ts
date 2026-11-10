import { expect, test, type APIRequestContext } from "@playwright/test";
import sharp from "sharp";

// These read the served HTML the way a link-preview crawler does, with no
// browser, so one run is enough.
test.skip(({ isMobile }) => isMobile, "no browser involved");

/** The `<meta>` tags of a page as served, before any script runs. */
async function tags(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  const html = await response.text();
  return Object.fromEntries(
    [
      ...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g),
    ].map(([, key, value]) => [key, value.replaceAll("&amp;", "&")]),
  );
}

const SPACE = "Earth seen from space, with the words";
const pages: { path: string; card: string; alt: RegExp }[] = [
  {
    path: "/",
    card: "/card/home.jpg",
    alt: new RegExp(`^${SPACE} “Why do ice ages come and go\\?”$`),
  },
  { path: "/lab", card: "/card/lab.jpg", alt: /“Orbital lab”$/ },
  { path: "/learn", card: "/card/learn.jpg", alt: /“How the cycles work”$/ },
  {
    path: "/learn/eccentricity",
    card: "/card/learn-eccentricity.jpg",
    alt: /“How orbit shape changes”$/,
  },
  {
    path: "/about",
    card: "/card/about.jpg",
    alt: /^Portrait of Milutin Milanković, with the words/,
  },
  { path: "/educators", card: "/card/educators.jpg", alt: new RegExp(SPACE) },
  { path: "/faq", card: "/card/faq.jpg", alt: new RegExp(SPACE) },
  { path: "/sources", card: "/card/sources.jpg", alt: new RegExp(SPACE) },
  {
    path: "/nl",
    card: "/nl/card/home.jpg",
    alt: /^De aarde gezien vanuit de ruimte, met de woorden “Waarom komen/,
  },
  {
    path: "/sr/lab",
    card: "/sr/card/lab.jpg",
    alt: /^Zemlja viđena iz svemira, uz reči „Orbitalna laboratorija“$/,
  },
  // Shared lab setups get a card of their own.
  {
    path: "/lab?t=-21",
    card: "/card/lab-t-21.jpg",
    alt: /^Orbital lab\. 21,000 years ago: 470 W\/m² at 65°N, ice at \d+% of its peak\.$/,
  },
  {
    path: "/nl/lab?t=50&scale=actual",
    card: "/nl/card/lab-t50.jpg",
    alt: /^Baanlab\. over 50\.000 jaar: \d+ W\/m² op 65°N\.$/,
  },
  {
    path: "/lab?e=0.05&o=24.5&p=270",
    card: "/card/lab-own-567.jpg",
    alt: /^Orbital lab\. A hand-set orbit: 567 W\/m² at 65°N\.$/,
  },
  {
    path: "/sr/lab?e=0.050000&o=24.5000&p=270.000&scale=5x",
    card: "/sr/card/lab-own-567.jpg",
    alt: /^Orbitalna laboratorija\. Ručno podešena orbita: 567 W\/m² na 65°N\.$/,
  },
];

for (const { path, card, alt } of pages) {
  test(`${path} previews with a 1200×630 card`, async ({ request }) => {
    const meta = await tags(request, path);
    expect(meta).toMatchObject({
      "og:image": `https://milankovitchcycles.com${card}`,
      "og:image:width": "1200",
      "og:image:height": "630",
      "twitter:card": "summary_large_image",
      "twitter:image": `https://milankovitchcycles.com${card}`,
    });
    expect(meta["og:image:alt"]).toMatch(alt);
    expect(meta["twitter:image:alt"]).toBe(meta["og:image:alt"]);

    const image = await request.get(card);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/jpeg");
    expect(await sharp(await image.body()).metadata()).toMatchObject({
      format: "jpeg",
      width: 1200,
      height: 630,
    });
  });
}

test("a shared setup keeps the lab's canonical address and names itself in the preview", async ({
  request,
}) => {
  const html = await (await request.get("/lab?t=-21")).text();
  expect(html).toContain(
    '<link rel="canonical" href="https://milankovitchcycles.com/lab"/>',
  );
  expect(await tags(request, "/lab?t=-21")).toMatchObject({
    "og:url": "https://milankovitchcycles.com/lab?t=-21",
    "og:title": "Orbital lab: 21,000 years ago · Milanković Cycles",
  });
});

test("links without a usable setup keep the plain lab card", async ({
  request,
}) => {
  for (const path of [
    "/lab?t=0",
    "/lab?e=bad&o=99&p=-1",
    "/lab?e=0.9&o=24.5&p=270",
    "/lab?scale=actual",
    "/lab?t=-9999",
  ])
    expect((await tags(request, path))["og:image"], path).toBe(
      "https://milankovitchcycles.com/card/lab.jpg",
    );
});

test("the shared lab opens on its setup and keeps the shared address", async ({
  page,
}) => {
  await page.goto("/lab?t=-21");
  await expect(page.getByText("21,000 years ago").first()).toBeVisible();
  await expect(page.locator(".lab-result__reading strong")).toHaveText("470");
  await expect(page).toHaveURL(/\/lab\?t=-21&scale=5x$/);
});

test("cards that no page or lab setup stands behind are not served", async ({
  request,
}) => {
  for (const path of [
    "/card/lab-own-999.jpg",
    "/card/lab-t-21.0.jpg",
    "/card/nope.jpg",
    "/card/home.png",
  ])
    expect((await request.get(path)).status(), path).toBe(404);
});
