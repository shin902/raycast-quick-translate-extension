import { GoogleGenerativeAI } from "@google/generative-ai";

// Constants for validation
const MIN_API_KEY_LENGTH = 30; // Gemini API keys are typically 30+ characters
const MAX_TEXT_LENGTH = 10000; // Maximum text length to prevent API quota issues

/**
 * Translate text to Japanese using Google Gemini API
 *
 * @param text - The text to translate (max 10,000 characters)
 * @param apiKey - Google Gemini API key (must start with "AI")
 * @param modelName - The Gemini model to use (default: gemini-2.0-flash-exp)
 * @returns Translated text in Japanese
 * @throws Error if text is empty, too long, or API call fails
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
  // Validate input text
  if (!text || text.trim().length === 0) {
    throw new Error("Text to translate cannot be empty");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text is too long (${text.length} characters). Maximum allowed: ${MAX_TEXT_LENGTH} characters`);
  }

  // Validate API key
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Gemini API key is required");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Enhanced prompt that handles edge cases
    const prompt = `以下のテキストを日本語に翻訳してください。
既に日本語の場合はそのまま返してください。
混在した言語の場合は、日本語以外の部分のみを翻訳してください。
翻訳結果のみを返し、説明や注釈は不要です：

${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    // Check if response is valid
    if (!response) {
      throw new Error("No response received from Gemini API");
    }

    const translatedText = response.text();

    if (!translatedText || translatedText.trim().length === 0) {
      throw new Error("Translation result is empty");
    }

    return translatedText.trim();
  } catch (error) {
    if (error instanceof Error) {
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
 * Gemini API keys must:
 * - Start with "AI"
 * - Be at least 30 characters long
 * - Contain only alphanumeric characters, underscores, or hyphens
 *
 * @example
 * ```typescript
 * isValidApiKeyFormat("AIzaSyD...") // true
 * isValidApiKeyFormat("invalid") // false
 * ```
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const trimmedKey = apiKey.trim();

  // Check minimum length
  if (trimmedKey.length < MIN_API_KEY_LENGTH) {
    return false;
  }

  // Gemini API keys start with "AI" and contain alphanumeric characters, underscores, or hyphens
  return /^AI[A-Za-z0-9_-]+$/.test(trimmedKey);
}
