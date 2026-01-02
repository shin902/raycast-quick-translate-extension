import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  API_TIMEOUT_MS,
  MIN_API_KEY_LENGTH,
  MAX_TEXT_LENGTH,
  CONSECUTIVE_SPACES_PATTERN,
  GEMINI_API_KEY_FLEXIBLE_PATTERN,
  ERROR_MESSAGES,
  TRANSLATION_PROMPT_TEMPLATE,
  MAX_RETRY_ATTEMPTS,
  INITIAL_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
  ALL_AVAILABLE_MODELS,
  OVERALL_TIMEOUT_MS,
  DEFAULT_GEMINI_MODEL,
  RETRY_BUFFER_TIME_MS,
  MIN_ATTEMPT_TIMEOUT_MS,
  PROVIDERS,
  type GeminiModelName,
} from "../constants";

/**
 * Custom Error class for translation timeouts
 */
export class TranslationTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationTimeoutError";
  }
}

/**
 * Sanitize user input text to prevent issues
 *
 * @param text - The text to sanitize
 * @returns Sanitized text
 *
 * @remarks
 * Performs the following sanitization:
 * - Trims leading/trailing whitespace
 * - Normalizes Unicode to NFC form (consistent character representation)
 * - Converts CRLF to LF (consistent line endings)
 * - Reduces excessive consecutive spaces (3+ spaces → 1 space)
 * - Removes zero-width characters (invisible Unicode characters)
 * - Removes control characters except newline/tab/CR
 *
 * Performance: Uses pre-compiled regex patterns from constants for efficiency
 */
export function sanitizeInput(text: string): string {
  return (
    text
      .trim()
      // Normalize Unicode (NFC form for consistent character representation)
      .normalize("NFC")
      // Normalize line breaks (CRLF -> LF)
      .replace(/\r\n/g, "\n")
      // Reduce excessive consecutive spaces to single space
      // Rationale: 3+ spaces are likely formatting errors or copy-paste artifacts
      .replace(CONSECUTIVE_SPACES_PATTERN, " ")
      // Remove zero-width characters that might cause issues
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // Remove control characters (except newline \n=0x0A, tab \t=0x09, carriage return \r=0x0D)
      // Using Unicode escapes to avoid ESLint no-control-regex warning
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "")
  );
}

/**
 * Create a timeout promise with cleanup capability
 *
 * @param ms - Timeout in milliseconds
 * @returns Object with promise and cancel function
 *
 * @remarks
 * Returns an object with:
 * - promise: Promise that rejects after timeout
 * - cancel: Function to clear the timeout timer
 *
 * Always call cancel() after the promise settles to prevent memory leaks
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
 * Check if an error is a quota-related error
 *
 * @param error - The error to check
 * @returns true if the error is a quota error, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await translateToJapanese(text, apiKey, model);
 * } catch (error) {
 *   if (error instanceof Error && isQuotaError(error)) {
 *     console.log("Quota exceeded - please try again later");
 *   }
 * }
 * ```
 */
export function isQuotaError(error: Error): boolean {
  return (
    error.message.includes("quota") ||
    error.message.includes("RESOURCE_EXHAUSTED") ||
    error.message.includes("429 Too Many Requests") ||
    error.message.includes("Too Many Requests")
  );
}

/**
 * Parse retry delay from error message
 *
 * @param errorMessage - The error message from the API
 * @returns Delay in milliseconds, or null if no delay found
 *
 * @remarks
 * Looks for patterns like "Please retry in 8.490937993s" or "retryDelay":"8s"
 * Uses Math.ceil to round up, ensuring we wait at least as long as the API suggests
 */
function parseRetryDelay(errorMessage: string): number | null {
  // Pattern 1: "Please retry in 8.490937993s"
  const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i);
  if (retryMatch) {
    // Round up to ensure we wait at least as long as the API suggests
    return Math.ceil(parseFloat(retryMatch[1]) * 1000);
  }

  // Pattern 2: "retryDelay":"8s" or "retryDelay":"8.5s"
  const jsonMatch = errorMessage.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
  if (jsonMatch) {
    // Round up to ensure we wait at least as long as the API suggests
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
 * Internal function to translate text using a specific model (without retry logic)
 *
 * @param sanitizedText - Pre-sanitized text to translate
 * @param apiKey - Google Gemini API key
 * @param modelName - The Gemini model to use
 * @param timeoutMs - Timeout in milliseconds (defaults to API_TIMEOUT_MS)
 * @returns Translated text in Japanese
 * @throws Error if API call fails or times out
 *
 * @remarks
 * This is an internal function used by translateToJapanese.
 * It does not implement retry logic or model fallback.
 * The timeout parameter allows the caller to specify a custom timeout based on remaining overall time.
 */
async function translateWithModelInternal(
  sanitizedText: string,
  apiKey: string,
  modelName: GeminiModelName,
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<string> {
  // Create timeout with cleanup capability using provided timeout
  const timeoutHandler = createTimeoutPromise(timeoutMs);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Use prompt template with clear delimiters to prevent injection
    const prompt = TRANSLATION_PROMPT_TEMPLATE(sanitizedText);

    // Race between API call and timeout
    const translationPromise = model.generateContent(prompt);
    const result = await Promise.race([translationPromise, timeoutHandler.promise]);

    // Clean up timeout immediately after successful API call
    timeoutHandler.cancel();

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
    // Always clean up timeout on error
    timeoutHandler.cancel();

    if (error instanceof Error) {
      // Handle timeout errors
      if (error instanceof TranslationTimeoutError) {
        throw error; // Re-throw timeout error as-is
      }

      // Handle specific API errors with original error context
      if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
        throw new Error(
          `Invalid API key: ${error.message}\n\nPlease check your Gemini API key in preferences.\nGet your API key from: https://makersuite.google.com/app/apikey`,
        );
      }
      if (error.message.includes("model") || error.message.includes("NOT_FOUND")) {
        throw new Error(`Invalid model selected: ${error.message}\n\nPlease check your model preference in settings.`);
      }
      if (error.message.includes("PERMISSION_DENIED")) {
        throw new Error(`Permission denied: ${error.message}\n\nPlease check your API key permissions.`);
      }
      // Re-throw quota errors and other errors as-is for handling by caller
      throw error;
    }
    throw new Error("An unexpected error occurred during translation");
  }
}

/**
 * Translate text to Japanese using Google Gemini API with retry logic and model fallback
 *
 * @param text - The text to translate (max 10,000 characters)
 * @param apiKey - Google Gemini API key (must start with "AIza")
 * @param modelName - The Gemini model to use (default: gemini-2.0-flash-exp)
 * @returns Translated text in Japanese
 * @throws Error if text is empty, too long, API call fails, or times out
 *
 * @remarks
 * - API calls timeout after 30 seconds per request
 * - Overall timeout of 60 seconds for all retry/fallback attempts
 * - Input is sanitized to remove problematic characters
 * - Prompt injection is mitigated by clear text delimiters
 * - Implements retry with exponential backoff for quota errors (up to 2 attempts)
 * - Automatically falls back to alternative models if quota is exceeded
 *
 * **Known Limitation**: If the timeout occurs, the underlying API request continues
 * in the background and cannot be cancelled. The @google/generative-ai library
 * does not currently support AbortController for request cancellation. This means:
 * - Network resources are used until the request completes naturally
 * - API quota is consumed even if the user sees a timeout error
 * - Consider this when setting timeout values
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
  modelName: GeminiModelName = DEFAULT_GEMINI_MODEL,
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
    throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED(PROVIDERS.GEMINI));
  }

  // Track overall timeout to prevent excessive waiting
  const overallStartTime = Date.now();

  // Helper function to get remaining time until overall timeout
  const getRemainingTimeout = (): number => {
    return OVERALL_TIMEOUT_MS - (Date.now() - overallStartTime);
  };

  // Helper function to check if overall timeout exceeded
  const checkOverallTimeout = () => {
    if (getRemainingTimeout() <= 0) {
      throw new Error(ERROR_MESSAGES.OVERALL_TIMEOUT(OVERALL_TIMEOUT_MS / 1000));
    }
  };

  // Try the primary model first with retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    // Check overall timeout before each attempt
    checkOverallTimeout();

    // Log retry attempt for debugging (development only)
    if (attempt > 0 && process.env.NODE_ENV === "development") {
      console.log(`[Gemini] Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} for model ${modelName}`);
    }

    try {
      // Calculate timeout for this attempt
      // Ensure timeout is always positive: max(MIN_ATTEMPT_TIMEOUT_MS, min(remaining - buffer, API_TIMEOUT_MS))
      const remainingTime = getRemainingTimeout();
      const timeoutWithBuffer = remainingTime - RETRY_BUFFER_TIME_MS;
      const attemptTimeout = Math.max(MIN_ATTEMPT_TIMEOUT_MS, Math.min(timeoutWithBuffer, API_TIMEOUT_MS));

      // Call API with calculated timeout (internal timeout handler, no external race)
      const result = await translateWithModelInternal(sanitizedText, apiKey, modelName, attemptTimeout);
      return result;
    } catch (error) {
      // Only handle Error instances
      if (!(error instanceof Error)) {
        throw error;
      }

      lastError = error;

      // If it's a quota error, try to retry with delay
      if (isQuotaError(error)) {
        // If this is the last attempt, break and try fallback models
        if (attempt === MAX_RETRY_ATTEMPTS - 1) {
          break;
        }

        // Parse retry delay from error message, or use exponential backoff
        const suggestedDelay = parseRetryDelay(error.message);
        const baseDelay = suggestedDelay || INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

        // Calculate remaining time and adjust delay accordingly
        const remainingTime = getRemainingTimeout();
        const maxAllowedDelay = Math.max(0, remainingTime - RETRY_BUFFER_TIME_MS);

        // Use the minimum of: base delay, MAX_RETRY_DELAY_MS, and remaining time
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

  // If primary model failed with quota error, try fallback models
  if (lastError && isQuotaError(lastError)) {
    // Build dynamic fallback list excluding the primary model
    const fallbackModels = ALL_AVAILABLE_MODELS.filter((model) => model !== modelName);

    // Guard against empty fallback list
    if (fallbackModels.length === 0) {
      // This should never happen unless ALL_AVAILABLE_MODELS only contains one model
      throw new Error(ERROR_MESSAGES.QUOTA_EXCEEDED(modelName, true));
    }

    for (const fallbackModel of fallbackModels) {
      // Check overall timeout before trying fallback model
      checkOverallTimeout();

      // Log fallback attempt for debugging (development only)
      if (process.env.NODE_ENV === "development") {
        console.log(`[Gemini] Trying fallback model: ${fallbackModel} (primary model ${modelName} exhausted quota)`);
      }

      try {
        // Calculate timeout for this attempt
        // Ensure timeout is always positive: max(MIN_ATTEMPT_TIMEOUT_MS, min(remaining - buffer, API_TIMEOUT_MS))
        const remainingTime = getRemainingTimeout();
        const timeoutWithBuffer = remainingTime - RETRY_BUFFER_TIME_MS;
        const attemptTimeout = Math.max(MIN_ATTEMPT_TIMEOUT_MS, Math.min(timeoutWithBuffer, API_TIMEOUT_MS));

        // Call API with calculated timeout (internal timeout handler, no external race)
        const result = await translateWithModelInternal(sanitizedText, apiKey, fallbackModel, attemptTimeout);

        // Success with fallback model - log for debugging (development only)
        if (process.env.NODE_ENV === "development") {
          console.log(`[Gemini] Translation succeeded with fallback model: ${fallbackModel}`);
        }
        return result;
      } catch (error) {
        // Only handle Error instances
        if (!(error instanceof Error)) {
          throw error;
        }

        lastError = error;

        // Continue to next fallback model if this one also has quota issues
        if (isQuotaError(error)) {
          continue;
        }

        // If it's not a quota error, throw immediately
        throw error;
      }
    }

    // All models failed with quota errors
    throw new Error(ERROR_MESSAGES.QUOTA_EXCEEDED(modelName, true));
  }

  // If we got here, something went wrong
  if (lastError) {
    throw lastError;
  }

  throw new Error("An unexpected error occurred during translation");
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
  return GEMINI_API_KEY_FLEXIBLE_PATTERN.test(trimmedKey);
}
