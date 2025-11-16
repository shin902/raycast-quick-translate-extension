/**
 * Unit tests for Gemini API utility functions
 */

import { isValidApiKeyFormat } from "./gemini";

describe("isValidApiKeyFormat", () => {
  describe("valid API keys", () => {
    it("should accept standard Gemini API key format (AIza prefix)", () => {
      const validKey = "AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz";
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should accept flexible format with AI prefix", () => {
      const validKey = "AI1234567890abcdefghijklmnopqrstuvwxyz";
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should accept keys with underscores and hyphens", () => {
      const validKey = "AIzaSy_123-456_789-abcdefghijklmnopqrstuvw";
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should accept keys with exactly minimum length (30 chars)", () => {
      const validKey = "AI" + "a".repeat(28); // 30 characters total
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it("should trim whitespace before validation", () => {
      const validKey = "  AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz  ";
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });
  });

  describe("invalid API keys", () => {
    it("should reject empty string", () => {
      expect(isValidApiKeyFormat("")).toBe(false);
    });

    it("should reject keys shorter than minimum length", () => {
      const shortKey = "AIza123";
      expect(isValidApiKeyFormat(shortKey)).toBe(false);
    });

    it("should reject keys without AI prefix", () => {
      const invalidKey = "XYza1234567890abcdefghijklmnopqrstuvwxyz";
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });

    it("should reject keys with invalid characters", () => {
      const invalidKey = "AIza1234567890@#$%^&*()abcdefghijklmno";
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });

    it("should reject keys with spaces in the middle", () => {
      const invalidKey = "AIza1234567890 abcdefghijklmnopqrstuvwxyz";
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });

    it("should reject whitespace-only string", () => {
      expect(isValidApiKeyFormat("   ")).toBe(false);
    });

    it("should reject null/undefined-like strings", () => {
      expect(isValidApiKeyFormat("null")).toBe(false);
      expect(isValidApiKeyFormat("undefined")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle very long keys", () => {
      const longKey = "AI" + "a".repeat(100);
      expect(isValidApiKeyFormat(longKey)).toBe(true);
    });

    it("should reject keys with only prefix", () => {
      expect(isValidApiKeyFormat("AI")).toBe(false);
      expect(isValidApiKeyFormat("AIza")).toBe(false);
    });
  });
});
