/**
 * Unit tests for application constants and utility functions
 */

import {
  isValidGeminiModel,
  GEMINI_MODELS,
  VALID_GEMINI_MODELS,
  MAX_TEXT_LENGTH,
  API_TIMEOUT_MS,
  MIN_API_KEY_LENGTH,
} from "./constants";

describe("isValidGeminiModel", () => {
  describe("valid models", () => {
    it("should accept gemini-2.5-pro", () => {
      expect(isValidGeminiModel("gemini-2.5-pro")).toBe(true);
    });

    it("should accept gemini-2.5-flash", () => {
      expect(isValidGeminiModel("gemini-2.5-flash")).toBe(true);
    });

    it("should accept gemini-2.5-flash-lite", () => {
      expect(isValidGeminiModel("gemini-2.5-flash-lite")).toBe(true);
    });

    it("should accept all models from GEMINI_MODELS constant", () => {
      Object.values(GEMINI_MODELS).forEach((model) => {
        expect(isValidGeminiModel(model)).toBe(true);
      });
    });
  });

  describe("invalid models", () => {
    it("should reject empty string", () => {
      expect(isValidGeminiModel("")).toBe(false);
    });

    it("should reject non-existent model names", () => {
      expect(isValidGeminiModel("gemini-1.0-pro")).toBe(false);
      expect(isValidGeminiModel("gpt-4")).toBe(false);
      expect(isValidGeminiModel("claude-3")).toBe(false);
    });

    it("should reject model names with typos", () => {
      expect(isValidGeminiModel("gemini-2.5-pRo")).toBe(false); // Case mismatch
      expect(isValidGeminiModel("gemini-2.5-flash ")).toBe(false); // Trailing space
      expect(isValidGeminiModel(" gemini-2.5-flash")).toBe(false); // Leading space
    });

    it("should reject partial model names", () => {
      expect(isValidGeminiModel("gemini")).toBe(false);
      expect(isValidGeminiModel("2.5-flash")).toBe(false);
    });

    it("should be case-sensitive", () => {
      expect(isValidGeminiModel("GEMINI-2.5-FLASH")).toBe(false);
      expect(isValidGeminiModel("Gemini-2.5-Flash")).toBe(false);
    });
  });

  describe("type guard behavior", () => {
    it("should narrow type when used in conditional", () => {
      const model: string = "gemini-2.5-flash";

      if (isValidGeminiModel(model)) {
        // TypeScript should recognize model as GeminiModelName here
        // This test verifies the type guard works correctly
        const validModel = model;
        expect(VALID_GEMINI_MODELS).toContain(validModel);
      }
    });
  });
});

describe("Constants validation", () => {
  describe("GEMINI_MODELS", () => {
    it("should have PRO_2_5 defined", () => {
      expect(GEMINI_MODELS.PRO_2_5).toBe("gemini-2.5-pro");
    });

    it("should have FLASH_2_5 defined", () => {
      expect(GEMINI_MODELS.FLASH_2_5).toBe("gemini-2.5-flash");
    });

    it("should have FLASH_LITE_2_5 defined", () => {
      expect(GEMINI_MODELS.FLASH_LITE_2_5).toBe("gemini-2.5-flash-lite");
    });

    it("should have exactly 3 models", () => {
      expect(Object.keys(GEMINI_MODELS)).toHaveLength(3);
    });
  });

  describe("VALID_GEMINI_MODELS", () => {
    it("should contain all models from GEMINI_MODELS", () => {
      Object.values(GEMINI_MODELS).forEach((model) => {
        expect(VALID_GEMINI_MODELS).toContain(model);
      });
    });

    it("should have exactly 3 models", () => {
      expect(VALID_GEMINI_MODELS).toHaveLength(3);
    });

    it("should not have duplicates", () => {
      const uniqueModels = new Set(VALID_GEMINI_MODELS);
      expect(uniqueModels.size).toBe(VALID_GEMINI_MODELS.length);
    });
  });

  describe("Configuration constants", () => {
    it("should have reasonable MAX_TEXT_LENGTH", () => {
      expect(MAX_TEXT_LENGTH).toBe(10000);
      expect(MAX_TEXT_LENGTH).toBeGreaterThan(0);
    });

    it("should have reasonable API_TIMEOUT_MS", () => {
      expect(API_TIMEOUT_MS).toBe(30000);
      expect(API_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it("should have reasonable MIN_API_KEY_LENGTH", () => {
      expect(MIN_API_KEY_LENGTH).toBe(30);
      expect(MIN_API_KEY_LENGTH).toBeGreaterThan(0);
    });
  });
});
