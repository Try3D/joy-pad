import { describe, expect, it } from "vitest";
import { formatTimestamp, generateRoomCode } from "./index";

describe("Shared Utility Functions", () => {
  describe("generateRoomCode", () => {
    it("should generate a 6-character string", () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
    });

    it("should only contain uppercase letters", () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z]+$/);
    });

    it("should generate different codes on subsequent calls", () => {
      const code1 = generateRoomCode();
      const code2 = generateRoomCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamp correctly", () => {
      const date = new Date("2023-01-01T12:30:45.123");
      const formatted = formatTimestamp(date.getTime());

      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    });
  });
});
