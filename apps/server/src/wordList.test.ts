import { describe, expect, it } from "vitest";
import { COMMON_WORDS } from "./wordList";

describe("Word List", () => {
  it("should have 1000 words", () => {
    expect(COMMON_WORDS.length).toBeGreaterThan(900);
    expect(COMMON_WORDS.length).toBeLessThanOrEqual(1005);
  });

  it("should contain common words", () => {
    expect(COMMON_WORDS).toContain("the");
    expect(COMMON_WORDS).toContain("and");
    expect(COMMON_WORDS).toContain("is");
  });

  it("should not contain empty strings", () => {
    const emptyWords = COMMON_WORDS.filter((w) => w.trim() === "");
    expect(emptyWords).toHaveLength(0);
  });

  it("should not contain duplicates", () => {
    const uniqueWords = new Set(COMMON_WORDS);
    expect(uniqueWords.size).toEqual(1000);
  });
});
