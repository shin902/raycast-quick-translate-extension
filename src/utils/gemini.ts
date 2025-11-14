import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  API_TIMEOUT_MS,
  MIN_API_KEY_LENGTH,
  MAX_TEXT_LENGTH,
  API_KEY_FLEXIBLE_PATTERN,
  ERROR_MESSAGES,
  TRANSLATION_PROMPT_TEMPLATE,
} from "../constants";

/**
 * Sanitize user input text to prevent issues
 *
 * @param text - The text to sanitize
 * @returns Sanitized text
 */
function sanitizeInput(text: string): string {
  return (
    text
      .trim()
      // Normalize line breaks
      .replace(/\r\n/g, "\n")
      // Remove multiple consecutive spaces (but preserve intentional formatting)
      .replace(/ {3,}/g, "  ")
      // Remove zero-width characters that might cause issues
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
  );
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 *
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects with timeout error
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(ERROR_MESSAGES.TIMEOUT(ms)));
    }, ms);
  });
}

/**
 * Translate text to Japanese using Google Gemini API with timeout protection
 *
 * @param text - The text to translate (max 10,000 characters)
 * @param apiKey - Google Gemini API key (must start with "AIza")
 * @param modelName - The Gemini model to use (default: gemini-2.0-flash-exp)
 * @returns Translated text in Japanese
 * @throws Error if text is empty, too long, API call fails, or times out
 *
 * @remarks
 * - API calls timeout after 30 seconds
 * - Input is sanitized to remove problematic characters
 * - Prompt injection is mitigated by clear text delimiters
 *
 * @example
 * ```typescript
 * const translated = await translateToJapanese("Hello world", apiKey);
 * console.log(translated); // "こんにちは世界"
 * ```
 */
export async function translateToJapanese(
  text: string,
  apiKey: string,
  modelName: string = "gemini-2.0-flash-exp",
): Promise<string> {
  // Sanitize input text
  const sanitizedText = sanitizeInput(text);

  // Validate input text
  if (!sanitizedText || sanitizedText.length === 0) {
    throw new Error(ERROR_MESSAGES.EMPTY_TEXT);
  }

  if (sanitizedText.length > MAX_TEXT_LENGTH) {
    throw new Error(ERROR_MESSAGES.TEXT_TOO_LONG(sanitizedText.length));
  }

  // Validate API key
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Use prompt template with clear delimiters to prevent injection
    const prompt = TRANSLATION_PROMPT_TEMPLATE(sanitizedText);

    // Race between API call and timeout
    const translationPromise = model.generateContent(prompt);
    const result = await Promise.race([translationPromise, createTimeoutPromise(API_TIMEOUT_MS)]);

    const response = result.response;

    // Check if response is valid
    if (!response) {
      throw new Error(ERROR_MESSAGES.NO_RESPONSE);
    }

    const translatedText = response.text();

    if (!translatedText || translatedText.trim().length === 0) {
      throw new Error(ERROR_MESSAGES.EMPTY_TRANSLATION);
    }

    return translatedText.trim();
  } catch (error) {
    if (error instanceof Error) {
      // Handle timeout errors
      if (error.message.includes("timed out")) {
        throw error; // Re-throw timeout error as-is
      }

      // Handle specific API errors with original error context
      if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
        throw new Error(
          `Invalid API key: ${error.message}\n\nPlease check your Gemini API key in preferences.\nGet your API key from: https://makersuite.google.com/app/apikey`,
        );
      }
      if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
        throw new Error(
          `API quota exceeded: ${error.message}\n\nPlease try again later or check your quota at: https://console.cloud.google.com/`,
        );
      }
      if (error.message.includes("model") || error.message.includes("NOT_FOUND")) {
        throw new Error(`Invalid model selected: ${error.message}\n\nPlease check your model preference in settings.`);
      }
      if (error.message.includes("PERMISSION_DENIED")) {
        throw new Error(`Permission denied: ${error.message}\n\nPlease check your API key permissions.`);
      }
      // Re-throw with context for debugging
      throw new Error(`Translation failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during translation");
  }
}

/**
 * Validate if the API key format is correct for Gemini API
 *
 * @param apiKey - The API key to validate
 * @returns true if the format appears valid, false otherwise
 *
 * @remarks
 * Gemini API keys typically follow this format:
 * - Standard format: AIza[A-Za-z0-9_-]{35} (total 39 characters)
 * - Example: AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz
 * - Prefix: "AIza" (standard) or "AI" (legacy/alternative formats)
 * - Length: At least 30 characters
 * - Characters: Alphanumeric, underscores, and hyphens only
 *
 * This function uses a flexible pattern to accommodate different key formats.
 *
 * @see https://ai.google.dev/gemini-api/docs/api-key - Official API key documentation
 *
 * @example
 * ```typescript
 * isValidApiKeyFormat("AIzaSyD1234567890...") // true (standard format)
 * isValidApiKeyFormat("AI1234567890abcdef...") // true (flexible format)
 * isValidApiKeyFormat("invalid") // false (too short)
 * isValidApiKeyFormat("") // false (empty)
 * ```
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const trimmedKey = apiKey.trim();

  // Check minimum length (Gemini API keys are at least 30 characters)
  if (trimmedKey.length < MIN_API_KEY_LENGTH) {
    return false;
  }

  // Use flexible pattern to accommodate different key formats
  // Matches keys starting with "AI" followed by alphanumeric, underscores, or hyphens
  return API_KEY_FLEXIBLE_PATTERN.test(trimmedKey);
}
