import { getSelectedText, Clipboard } from "@raycast/api";
import { MAX_TEXT_LENGTH, ERROR_MESSAGES } from "../constants";

/**
 * Result of text retrieval operation
 */
export interface TextSourceResult {
  /** The text to translate */
  text: string;
  /** Whether the text was retrieved from clipboard (true) or selection (false) */
  fromClipboard: boolean;
}

/**
 * Get text to translate from selected text or clipboard
 *
 * @returns Text source result with text and source indicator
 * @throws Error if no text is available from either source
 *
 * @remarks
 * Attempts to get text in the following order:
 * 1. Selected text (primary source)
 * 2. Clipboard text (fallback)
 *
 * @example
 * ```typescript
 * const { text, fromClipboard } = await getTextToTranslate();
 * if (fromClipboard) {
 *   console.log("Using clipboard text");
 * }
 * ```
 */
export async function getTextToTranslate(): Promise<TextSourceResult> {
  let text = "";
  let fromClipboard = false;

  try {
    // Try to get selected text first
    text = await getSelectedText();
  } catch {
    // If no text is selected, try clipboard
    try {
      const clipboardText = await Clipboard.readText();
      if (clipboardText && clipboardText.trim().length > 0) {
        text = clipboardText;
        fromClipboard = true;
      }
    } catch {
      // Clipboard also failed
    }
  }

  if (!text || text.trim().length === 0) {
    throw new Error(ERROR_MESSAGES.NO_TEXT_TO_TRANSLATE);
  }

  return { text, fromClipboard };
}

/**
 * Validate text length for translation
 *
 * @param text - The text to validate
 * @throws Error if text exceeds maximum length
 *
 * @remarks
 * Maximum length is defined in constants (10,000 characters)
 * This is a UI-level check to provide early feedback
 *
 * @example
 * ```typescript
 * try {
 *   validateTextLength(userInput);
 * } catch (error) {
 *   showError(error.message);
 * }
 * ```
 */
export function validateTextLength(text: string): void {
  const trimmedText = text.trim();
  if (trimmedText.length > MAX_TEXT_LENGTH) {
    throw new Error(ERROR_MESSAGES.TEXT_TOO_LONG(trimmedText.length));
  }
}
