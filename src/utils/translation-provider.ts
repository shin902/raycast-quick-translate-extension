/**
 * Translation provider abstraction layer
 *
 * This module provides a unified interface for different translation providers
 * (Gemini, Groq, etc.) to enable easy switching between providers.
 */

import * as GeminiProvider from "./gemini";
import * as GroqProvider from "./groq";
import {
  PROVIDERS,
  GEMINI_API_KEY_FLEXIBLE_PATTERN,
  GROQ_API_KEY_PATTERN,
  type ProviderName,
  type GeminiModelName,
  type GroqModelName,
  type ModelName,
} from "../constants";

/**
 * Validate API key format for a given provider
 *
 * @param apiKey - The API key to validate
 * @param provider - The provider name
 * @returns true if the format appears valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidApiKeyFormat("AIza...", PROVIDERS.GEMINI); // true
 * isValidApiKeyFormat("gsk_...", PROVIDERS.GROQ); // true
 * ```
 */
export function isValidApiKeyFormat(apiKey: string, provider: ProviderName): boolean {
  switch (provider) {
    case PROVIDERS.GEMINI:
      return GeminiProvider.isValidApiKeyFormat(apiKey);
    case PROVIDERS.GROQ:
      return GroqProvider.isValidApiKeyFormat(apiKey);
    default:
      return false;
  }
}

/**
 * Translate text to Japanese using the specified provider
 *
 * @param text - The text to translate
 * @param apiKey - The API key for the provider
 * @param provider - The provider to use
 * @param model - The model to use
 * @returns Translated text in Japanese
 * @throws Error if validation fails or API call fails
 *
 * @example
 * ```typescript
 * // Using Gemini
 * const result1 = await translateToJapanese(
 *   "Hello",
 *   geminiKey,
 *   PROVIDERS.GEMINI,
 *   GEMINI_MODELS.FLASH_LITE_2_5
 * );
 *
 * // Using Groq
 * const result2 = await translateToJapanese(
 *   "Hello",
 *   groqKey,
 *   PROVIDERS.GROQ,
 *   GROQ_MODELS.LLAMA_3_3_70B
 * );
 * ```
 */
export async function translateToJapanese(
  text: string,
  apiKey: string,
  provider: ProviderName,
  model: ModelName,
): Promise<string> {
  switch (provider) {
    case PROVIDERS.GEMINI:
      return GeminiProvider.translateToJapanese(text, apiKey, model as GeminiModelName);
    case PROVIDERS.GROQ:
      return GroqProvider.translateToJapanese(text, apiKey, model as GroqModelName);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Check if an error is a quota-related error
 *
 * @param error - The error to check
 * @returns true if the error is a quota error, false otherwise
 */
export function isQuotaError(error: Error): boolean {
  return GeminiProvider.isQuotaError(error);
}

/**
 * Sanitize user input text
 *
 * @param text - The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeInput(text: string): string {
  return GeminiProvider.sanitizeInput(text);
}
