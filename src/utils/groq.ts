import Groq from "groq-sdk";
import {
  API_TIMEOUT_MS,
  MAX_TEXT_LENGTH,
  ERROR_MESSAGES,
  TRANSLATION_PROMPT_TEMPLATE,
  MAX_RETRY_ATTEMPTS,
  INITIAL_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
  OVERALL_TIMEOUT_MS,
  RETRY_BUFFER_TIME_MS,
  MIN_ATTEMPT_TIMEOUT_MS,
  GROQ_API_KEY_PATTERN,
  PROVIDERS,
  type GroqModelName,
} from "../constants";
import { sanitizeInput, TranslationTimeoutError, isQuotaError } from "./gemini";

/**
 * Validate if the API key format is correct for Groq API
 *
 * @param apiKey - The API key to validate
 * @returns true if the format appears valid, false otherwise
 *
 * @remarks
 * Groq API keys typically follow this format:
 * - Format: gsk_[A-Za-z0-9]{40+}
 * - Example: gsk_1234567890abcdefghijklmnopqrstuvwxyz1234
 *
 * @see https://console.groq.com/keys - Official API key documentation
 *
 * @example
 * ```typescript
 * isValidApiKeyFormat("gsk_1234567890...") // true
 * isValidApiKeyFormat("invalid") // false
 * ```
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const trimmedKey = apiKey.trim();

  // Check minimum length
  if (trimmedKey.length < 44) {
    // gsk_ (4) + 40 chars
    return false;
  }

  // Use pattern to match Groq API key format
  return GROQ_API_KEY_PATTERN.test(trimmedKey);
}

/**
 * Create a timeout promise with cleanup capability
 *
 * @param ms - Timeout in milliseconds
 * @returns Object with promise and cancel function
 */
function createTimeoutPromise(ms: number): { promise: Promise<never>; cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;

  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TranslationTimeoutError(ERROR_MESSAGES.TIMEOUT(ms)));
    }, ms);
  });

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return { promise, cancel };
}

/**
 * Parse retry delay from error message
 *
 * @param errorMessage - The error message from the API
 * @returns Delay in milliseconds, or null if no delay found
 */
function parseRetryDelay(errorMessage: string): number | null {
  // Pattern: "Please retry in 8.490937993s" or "retryDelay":"8s"
  const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i);
  if (retryMatch) {
    return Math.ceil(parseFloat(retryMatch[1]) * 1000);
  }

  const jsonMatch = errorMessage.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
  if (jsonMatch) {
    return Math.ceil(parseFloat(jsonMatch[1]) * 1000);
  }

  return null;
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Internal function to translate text using Groq API (without retry logic)
 *
 * @param sanitizedText - Pre-sanitized text to translate
 * @param apiKey - Groq API key
 * @param modelName - The Groq model to use
 * @param timeoutMs - Timeout in milliseconds
 * @returns Translated text in Japanese
 * @throws Error if API call fails or times out
 */
async function translateWithModelInternal(
  sanitizedText: string,
  apiKey: string,
  modelName: GroqModelName,
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<string> {
  const timeoutHandler = createTimeoutPromise(timeoutMs);

  try {
    const groq = new Groq({ apiKey });

    // Use prompt template with clear delimiters
    const prompt = TRANSLATION_PROMPT_TEMPLATE(sanitizedText);

    // Race between API call and timeout
    const translationPromise = groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: modelName,
      temperature: 0.3,
      max_tokens: 4096,
    });

    const result = await Promise.race([translationPromise, timeoutHandler.promise]);

    // Clean up timeout immediately after successful API call
    timeoutHandler.cancel();

    // Check if response is valid
    if (!result || !result.choices || result.choices.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_RESPONSE);
    }

    const translatedText = result.choices[0]?.message?.content;

    if (!translatedText || translatedText.trim().length === 0) {
      throw new Error(ERROR_MESSAGES.EMPTY_TRANSLATION);
    }

    return translatedText.trim();
  } catch (error) {
    // Always clean up timeout on error
    timeoutHandler.cancel();

    if (error instanceof Error) {
      // Handle timeout errors
      if (error instanceof TranslationTimeoutError) {
        throw error;
      }

      // Handle specific API errors
      if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
        throw new Error(
          `Invalid API key: ${error.message}\\n\\nPlease check your Groq API key in preferences.\\nGet your API key from: https://console.groq.com/keys`,
        );
      }
      if (error.message.includes("model") || error.message.includes("NOT_FOUND")) {
        throw new Error(`Invalid model selected: ${error.message}\\n\\nPlease check your model preference in settings.`);
      }
      if (error.message.includes("PERMISSION_DENIED")) {
        throw new Error(`Permission denied: ${error.message}\\n\\nPlease check your API key permissions.`);
      }

      // Re-throw other errors for handling by caller
      throw error;
    }
    throw new Error("An unexpected error occurred during translation");
  }
}

/**
 * Translate text to Japanese using Groq API with retry logic
 *
 * @param text - The text to translate (max 10,000 characters)
 * @param apiKey - Groq API key
 * @param modelName - The Groq model to use
 * @returns Translated text in Japanese
 * @throws Error if text is empty, too long, API call fails, or times out
 *
 * @remarks
 * - API calls timeout after 30 seconds per request
 * - Overall timeout of 60 seconds for all retry attempts
 * - Input is sanitized to remove problematic characters
 * - Implements retry with exponential backoff for quota errors
 *
 * @example
 * ```typescript
 * const translated = await translateToJapanese("Hello world", apiKey, "llama-3.3-70b-versatile");
 * console.log(translated); // "こんにちは世界"
 * ```
 */
export async function translateToJapanese(
  text: string,
  apiKey: string,
  modelName: GroqModelName,
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
    throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED(PROVIDERS.GROQ));
  }

  // Track overall timeout
  const overallStartTime = Date.now();

  const getRemainingTimeout = (): number => {
    return OVERALL_TIMEOUT_MS - (Date.now() - overallStartTime);
  };

  const checkOverallTimeout = () => {
    if (getRemainingTimeout() <= 0) {
      throw new Error(ERROR_MESSAGES.OVERALL_TIMEOUT(OVERALL_TIMEOUT_MS / 1000));
    }
  };

  // Try with retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    checkOverallTimeout();

    if (attempt > 0 && process.env.NODE_ENV === "development") {
      console.log(`[Groq] Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} for model ${modelName}`);
    }

    try {
      const remainingTime = getRemainingTimeout();
      const timeoutWithBuffer = remainingTime - RETRY_BUFFER_TIME_MS;
      const attemptTimeout = Math.max(MIN_ATTEMPT_TIMEOUT_MS, Math.min(timeoutWithBuffer, API_TIMEOUT_MS));

      const result = await translateWithModelInternal(sanitizedText, apiKey, modelName, attemptTimeout);
      return result;
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      lastError = error;

      // If it's a quota error, try to retry with delay
      if (isQuotaError(error)) {
        if (attempt === MAX_RETRY_ATTEMPTS - 1) {
          break;
        }

        const suggestedDelay = parseRetryDelay(error.message);
        const baseDelay = suggestedDelay || INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

        const remainingTime = getRemainingTimeout();
        const maxAllowedDelay = Math.max(0, remainingTime - RETRY_BUFFER_TIME_MS);

        const actualDelay = Math.min(baseDelay, MAX_RETRY_DELAY_MS, maxAllowedDelay);

        if (actualDelay > 0) {
          await sleep(actualDelay);
        }
        continue;
      }

      // If it's not a quota error, throw immediately
      throw error;
    }
  }

  // If we got here with a quota error, throw it
  if (lastError && isQuotaError(lastError)) {
    throw new Error(ERROR_MESSAGES.QUOTA_EXCEEDED(modelName, false));
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("An unexpected error occurred during translation");
}
