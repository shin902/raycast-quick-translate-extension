import { translateToJapanese, isValidApiKeyFormat } from "../utils/translation-provider";
import { getTextToTranslate, validateTextLength } from "../utils/text-source";
import { ERROR_MESSAGES, type ProviderName, type ModelName } from "../constants";

/**
 * Options for translation operation
 */
export interface TranslationOptions {
  /** Translation provider (Gemini or Groq) */
  provider: ProviderName;
  /** API key for the provider */
  apiKey: string;
  /** Model to use */
  model: ModelName;
  /** Original text to re-translate (optional, for re-translation) */
  originalText?: string;
}

/**
 * Result of translation operation
 */
export interface TranslationResult {
  /** Original text that was translated */
  originalText: string;
  /** Translated text in Japanese */
  translatedText: string;
  /** Whether the text was retrieved from clipboard */
  fromClipboard: boolean;
}

/**
 * Progress callback for translation operation
 *
 * @param message - Progress message to display
 * @param fromClipboard - Whether the text was retrieved from clipboard
 */
export type TranslationProgressCallback = (message: string, fromClipboard: boolean) => void;

/**
 * Translate text to Japanese with comprehensive error handling
 *
 * @param options - Translation options
 * @param onProgress - Optional callback for progress updates
 * @returns Translation result with original and translated text
 * @throws Error if validation fails or API call fails
 *
 * @remarks
 * This function orchestrates the entire translation flow:
 * 1. Get text from selection or clipboard (if not re-translating)
 * 2. Validate API key format
 * 3. Validate text length
 * 4. Call translation API
 * 5. Return results
 *
 * Progress callback is called at key stages to provide user feedback.
 *
 * @example
 * ```typescript
 * // Initial translation
 * const result = await translateText(
 *   { apiKey, model: "gemini-2.5-flash-lite" },
 *   (message) => console.log(message)
 * );
 *
 * // Re-translation with different model
 * const result2 = await translateText(
 *   { apiKey, model: "gemini-2.5-pro", originalText: result.originalText },
 *   (message) => console.log(message)
 * );
 * ```
 */
export async function translateText(
  options: TranslationOptions,
  onProgress?: TranslationProgressCallback,
): Promise<TranslationResult> {
  const { provider, apiKey, model, originalText } = options;

  // Validate API key format
  if (!apiKey || !isValidApiKeyFormat(apiKey, provider)) {
    throw new Error(ERROR_MESSAGES.API_KEY_INVALID_FORMAT(provider));
  }

  // Get text to translate
  let textToTranslate: string;
  let fromClipboard = false;

  if (originalText) {
    // Re-translation: Use the stored original text
    textToTranslate = originalText;
  } else {
    // Initial translation: Get text from selection or clipboard
    const textSource = await getTextToTranslate();
    textToTranslate = textSource.text;
    fromClipboard = textSource.fromClipboard;
  }

  // Validate text length
  validateTextLength(textToTranslate);

  // Notify progress
  onProgress?.(
    fromClipboard ? `Using clipboard (${model}, auto-retry enabled)` : `Using ${model} (auto-retry enabled)`,
    fromClipboard,
  );

  // Translate the text
  const translatedText = await translateToJapanese(textToTranslate, apiKey, provider, model);

  return {
    originalText: textToTranslate,
    translatedText,
    fromClipboard,
  };
}
