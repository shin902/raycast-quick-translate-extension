/**
 * Unit tests for translation service
 */

import { translateText } from "./translation-service";
import { translateToJapanese, isValidApiKeyFormat } from "../utils/gemini";
import { getTextToTranslate, validateTextLength } from "../utils/text-source";
import { ERROR_MESSAGES, GEMINI_MODELS } from "../constants";

// Mock dependencies
jest.mock("../utils/gemini");
jest.mock("../utils/text-source");

const mockTranslateToJapanese = translateToJapanese as jest.MockedFunction<typeof translateToJapanese>;
const mockIsValidApiKeyFormat = isValidApiKeyFormat as jest.MockedFunction<typeof isValidApiKeyFormat>;
const mockGetTextToTranslate = getTextToTranslate as jest.MockedFunction<typeof getTextToTranslate>;
const mockValidateTextLength = validateTextLength as jest.MockedFunction<typeof validateTextLength>;

describe("translateText", () => {
  const validApiKey = "AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz";
  const model = GEMINI_MODELS.FLASH_LITE_2_5;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockIsValidApiKeyFormat.mockReturnValue(true);
    mockValidateTextLength.mockImplementation(() => {});
    mockTranslateToJapanese.mockResolvedValue("翻訳されたテキスト");
  });

  describe("initial translation", () => {
    it("should translate text from selection successfully", async () => {
      mockGetTextToTranslate.mockResolvedValue({
        text: "Hello world",
        fromClipboard: false,
      });

      const result = await translateText({
        apiKey: validApiKey,
        model,
      });

      expect(result).toEqual({
        originalText: "Hello world",
        translatedText: "翻訳されたテキスト",
        fromClipboard: false,
      });

      expect(mockGetTextToTranslate).toHaveBeenCalledTimes(1);
      expect(mockValidateTextLength).toHaveBeenCalledWith("Hello world");
      expect(mockTranslateToJapanese).toHaveBeenCalledWith("Hello world", validApiKey, model);
    });

    it("should translate text from clipboard successfully", async () => {
      mockGetTextToTranslate.mockResolvedValue({
        text: "Hello from clipboard",
        fromClipboard: true,
      });

      const result = await translateText({
        apiKey: validApiKey,
        model,
      });

      expect(result).toEqual({
        originalText: "Hello from clipboard",
        translatedText: "翻訳されたテキスト",
        fromClipboard: true,
      });
    });

    it("should call progress callback with correct message", async () => {
      mockGetTextToTranslate.mockResolvedValue({
        text: "Hello world",
        fromClipboard: false,
      });

      const onProgress = jest.fn();

      await translateText(
        {
          apiKey: validApiKey,
          model,
        },
        onProgress,
      );

      expect(onProgress).toHaveBeenCalledWith(
        expect.stringContaining(model),
        false,
      );
    });

    it("should call progress callback with clipboard indicator", async () => {
      mockGetTextToTranslate.mockResolvedValue({
        text: "Hello world",
        fromClipboard: true,
      });

      const onProgress = jest.fn();

      await translateText(
        {
          apiKey: validApiKey,
          model,
        },
        onProgress,
      );

      expect(onProgress).toHaveBeenCalledWith(
        expect.stringContaining("clipboard"),
        true,
      );
    });
  });

  describe("re-translation", () => {
    it("should re-translate using original text", async () => {
      const result = await translateText({
        apiKey: validApiKey,
        model,
        originalText: "Original text",
      });

      expect(result).toEqual({
        originalText: "Original text",
        translatedText: "翻訳されたテキスト",
        fromClipboard: false,
      });

      // Should not call getTextToTranslate when originalText is provided
      expect(mockGetTextToTranslate).not.toHaveBeenCalled();
      expect(mockValidateTextLength).toHaveBeenCalledWith("Original text");
      expect(mockTranslateToJapanese).toHaveBeenCalledWith("Original text", validApiKey, model);
    });

    it("should not call progress callback with clipboard indicator for re-translation", async () => {
      const onProgress = jest.fn();

      await translateText(
        {
          apiKey: validApiKey,
          model,
          originalText: "Original text",
        },
        onProgress,
      );

      expect(onProgress).toHaveBeenCalledWith(
        expect.stringContaining(model),
        false,
      );
    });
  });

  describe("validation errors", () => {
    it("should throw error for invalid API key format", async () => {
      mockIsValidApiKeyFormat.mockReturnValue(false);

      await expect(
        translateText({
          apiKey: "invalid-key",
          model,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.API_KEY_INVALID_FORMAT);
    });

    it("should throw error for empty API key", async () => {
      mockIsValidApiKeyFormat.mockReturnValue(false);

      await expect(
        translateText({
          apiKey: "",
          model,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.API_KEY_INVALID_FORMAT);
    });

    it("should throw error when text length validation fails", async () => {
      mockGetTextToTranslate.mockResolvedValue({
        text: "a".repeat(10001),
        fromClipboard: false,
      });
      mockValidateTextLength.mockImplementation(() => {
        throw new Error(ERROR_MESSAGES.TEXT_TOO_LONG(10001));
      });

      await expect(
        translateText({
          apiKey: validApiKey,
          model,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.TEXT_TOO_LONG(10001));
    });
  });

  describe("API errors", () => {
    it("should propagate translation API errors", async () => {
      mockGetTextToTranslate.mockResolvedValue({
        text: "Hello world",
        fromClipboard: false,
      });
      mockTranslateToJapanese.mockRejectedValue(new Error("API error"));

      await expect(
        translateText({
          apiKey: validApiKey,
          model,
        }),
      ).rejects.toThrow("API error");
    });

    it("should propagate text source errors", async () => {
      mockGetTextToTranslate.mockRejectedValue(new Error(ERROR_MESSAGES.NO_TEXT_TO_TRANSLATE));

      await expect(
        translateText({
          apiKey: validApiKey,
          model,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.NO_TEXT_TO_TRANSLATE);
    });
  });
});
