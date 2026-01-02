/**
 * Unit tests for Groq API utility functions
 */

import { isValidApiKeyFormat } from "./groq";

describe("Groq isValidApiKeyFormat", () => {
  describe("valid API keys", () => {
    it("should accept standard Groq API key format (gsk_ prefix)", () => {
      const validKey = "gsk_" + "a".repeat(40);
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should accept keys with exactly minimum length (44 chars)", () => {
      const validKey = "gsk_" + "a".repeat(40); // 44 characters total
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should accept keys longer than minimum length", () => {
      const validKey = "gsk_" + "a".repeat(50);
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should trim whitespace before validation", () => {
      const validKey = "  gsk_" + "a".repeat(40) + "  ";
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should accept keys with mixed case alphanumerics", () => {
      const validKey = "gsk_" + "AaBbCc123456789".repeat(3);
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });
  });

  describe("invalid API keys", () => {
    it("should reject empty string", () => {
      expect(isValidApiKeyFormat("")).toBe(false);
    });

    it("should reject keys shorter than minimum length", () => {
      const shortKey = "gsk_abc123";
      expect(isValidApiKeyFormat(shortKey)).toBe(false);
    });

    it("should reject keys without gsk_ prefix", () => {
      const invalidKey = "AIza" + "a".repeat(40);
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });

    it("should reject keys with invalid characters", () => {
      const invalidKey = "gsk_" + "@#$%^&*()".repeat(5);
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });

    it("should reject keys with spaces in the middle", () => {
      const invalidKey = "gsk_" + "a".repeat(20) + " " + "a".repeat(20);
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });

    it("should reject whitespace-only string", () => {
      expect(isValidApiKeyFormat("   ")).toBe(false);
    });

    it("should reject keys with only prefix", () => {
      expect(isValidApiKeyFormat("gsk_")).toBe(false);
    });

    it("should reject keys with underscores or hyphens (not in Groq format)", () => {
      const invalidKey = "gsk_" + "a_b-c".repeat(10);
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle very long keys", () => {
      const longKey = "gsk_" + "a".repeat(100);
      expect(isValidApiKeyFormat(longKey)).toBe(true);
    });

    it("should reject partial prefix", () => {
      expect(isValidApiKeyFormat("gs_" + "a".repeat(40))).toBe(false);
      expect(isValidApiKeyFormat("gsk" + "a".repeat(40))).toBe(false);
    });
  });
});
