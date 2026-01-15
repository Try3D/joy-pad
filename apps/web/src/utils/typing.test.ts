import { describe, expect, it } from "vitest";
import { calculateWPM } from "./typing";

describe("Typing Game Utilities", () => {
  describe("calculateWPM", () => {
    it("should return 0 if no time elapsed", () => {
      expect(calculateWPM(10, 1000, 1000)).toBe(0);
    });

    it("should calculate correct WPM for standard rate", () => {
      const start = Date.now();
      const end = start + 60000;
      expect(calculateWPM(60, start, end)).toBe(12);
    });

    it("should handle partial minutes correctly", () => {
      const start = Date.now();
      const end = start + 30000;
      expect(calculateWPM(30, start, end)).toBe(12);
    });

    it("should round correctly", () => {
      const start = Date.now();
      const end = start + 60000;
      expect(calculateWPM(5, start, end)).toBe(1);
    });
  });
});
