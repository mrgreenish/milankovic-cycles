import { describe, expect, it } from "vitest";
import {
  LOCALES,
  languageAlternates,
  localeFromPathname,
  localePath,
  stripLocale,
} from "./config";
import { getContent, getTopics } from "./content";
import { fill, group, num } from "./format";
import { getUi } from "./ui";
import { TOPIC_SLUGS } from "@/lib/learn/topics";
import { describeClimate, climateAt, formatTemperatureDelta } from "@/lib/orbital/climate";
import { describeParameter, formatSunlightDelta } from "@/lib/orbital/controls";
import { formatYears } from "@/lib/orbital/timeline";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";

/** Every string in a tree, with the path that leads to it. */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, item]) =>
      strings(item, path ? `${path}.${key}` : key),
    );
  return [];
}

const slots = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("language paths", () => {
  it("leaves English unprefixed and prefixes the others", () => {
    expect(localePath("en", "/lab")).toBe("/lab");
    expect(localePath("nl", "/")).toBe("/nl");
    expect(localePath("sr", "/lab?t=-21")).toBe("/sr/lab?t=-21");
  });

  it("finds the language and the site path again", () => {
    expect(stripLocale("/nl/learn/precession")).toBe("/learn/precession");
    expect(stripLocale("/nl")).toBe("/");
    expect(stripLocale("/about")).toBe("/about");
    expect(localeFromPathname("/sr/faq")).toBe("sr");
    expect(localeFromPathname("/faq")).toBe("en");
  });

  it("points every page at its translations", () => {
    expect(languageAlternates("/faq")).toEqual({
      en: "/faq",
      nl: "/nl/faq",
      "sr-Latn": "/sr/faq",
      "x-default": "/faq",
    });
  });
});

describe("translations", () => {
  const english = strings(getUi("en"));
  const englishContent = strings(getContent("en"));

  it.each(LOCALES)("%s has no empty or untranslated-looking gaps", (locale) => {
    for (const [path, text] of [
      ...strings(getUi(locale)),
      ...strings(getContent(locale)),
    ])
      expect(text.trim(), path).not.toBe("");
  });

  it.each(LOCALES)("%s keeps the same placeholders as English", (locale) => {
    const check = (a: [string, string][], b: [string, string][]) => {
      expect(b.map(([path]) => path)).toEqual(a.map(([path]) => path));
      a.forEach(([path, text], index) =>
        expect(slots(b[index][1]), path).toEqual(slots(text)),
      );
    };
    check(english, strings(getUi(locale)));
    check(englishContent, strings(getContent(locale)));
  });

  it.each(LOCALES)("%s has all guides, in the same order", (locale) => {
    expect(getTopics(locale).map((topic) => topic.slug)).toEqual([
      ...TOPIC_SLUGS,
    ]);
    const shape = (topic: ReturnType<typeof getTopics>[number]) => [
      topic.facts.length,
      topic.sections.map((section) => section.paragraphs.length),
      topic.questions.length,
    ];
    getTopics(locale).forEach((topic, index) =>
      expect(shape(topic)).toEqual(shape(getTopics("en")[index])),
    );
  });

  it("writes Serbian in Latin script", () => {
    const cyrillic = /[Ѐ-ӿ]/;
    for (const [path, text] of [
      ...strings(getUi("sr")),
      ...strings(getContent("sr")),
      ...strings(getTopics("sr")),
    ])
      expect(text, path).not.toMatch(cyrillic);
  });
});

describe("localized formatting", () => {
  it("fills slots and groups digits", () => {
    expect(fill("{a} of {b}", { a: 1, b: 6 })).toBe("1 of 6");
    expect(group(21000, ".")).toBe("21.000");
    expect(num({ decimal: "," }, 1.25, 1)).toBe("1,3");
  });

  it("describes years in each language", () => {
    expect(formatYears(-21, getUi("nl"))).toBe("21.000 jaar geleden");
    expect(formatYears(50, getUi("sr"))).toBe("za 50.000 godina");
    expect(formatYears(0, getUi("nl"))).toBe("Nu");
  });

  it("uses a decimal comma where the language does", () => {
    const nl = getUi("nl");
    expect(formatTemperatureDelta(-3.14, nl)).toBe("−3,1 °C");
    expect(formatSunlightDelta(-12.4, nl)).toBe("12 W/m² minder dan nu");
    expect(
      describeParameter("obliquityDeg", PRESENT_PARAMETERS, nl),
    ).toContain("uur");
    expect(describeClimate(climateAt(-21, PRESENT_PARAMETERS), -21, getUi("sr"))).toMatch(
      /^Izmereno u sedimentu morskog dna: /,
    );
  });
});
