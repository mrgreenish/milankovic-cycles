import { describe, expect, it } from "vitest";
import { PRESENT_PARAMETERS } from "./insolation";
import { parseLabQuery, serializeLabQuery } from "./query";

describe("lab URL state", () => {
  it("parses and serializes valid state", () => {
    const source = new URLSearchParams("e=0.018835&o=22.9641&p=115.234&scale=actual");
    const parsed = parseLabQuery(source);
    expect(parsed.invalidFields).toEqual([]);
    expect(parsed.scale).toBe("actual");
    expect(parsed.parameters.eccentricity).toBeCloseTo(0.018835, 8);
    expect(serializeLabQuery(parsed.parameters, parsed.scale)).toContain("scale=actual");
  });

  it("resets invalid fields to the present reference", () => {
    const source = new URLSearchParams("e=9&o=hello&p=-1&scale=giant");
    const parsed = parseLabQuery(source);
    expect(parsed.invalidFields).toEqual(["scale", "e", "o", "p"]);
    expect(parsed.parameters).toEqual(PRESENT_PARAMETERS);
    expect(parsed.scale).toBe("5x");
  });
});

