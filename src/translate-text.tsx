import {
  Detail,
  getPreferenceValues,
  getSelectedText,
  Clipboard,
  ActionPanel,
  Action,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { translateToJapanese, isValidApiKeyFormat } from "./utils/gemini";
import { MAX_TEXT_LENGTH, ERROR_MESSAGES } from "./constants";

/**
 * User preferences interface for the extension
 */
interface Preferences {
  geminiApiKey: string;
  geminiModel: string;
}

/**
 * Main component for translating selected text to Japanese using Gemini API
 *
 * This component handles:
 * - Retrieving text from selection or clipboard (with fallback)
 * - Validating API key format
 * - Calling Gemini API for translation
 * - Displaying results with copy/paste actions
 * - Comprehensive error handling with user-friendly messages
 *
 * @returns React component that displays translation results or errors
 */
export default function TranslateText() {
  const [isLoading, setIsLoading] = useState(true);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Main translation logic
     *
     * Flow:
     * 1. Get preferences (API key, model)
     * 2. Validate API key format
     * 3. Get text from selection (or fallback to clipboard)
     * 4. Call translation API
     * 5. Display results or errors
     */
    async function translate() {
      let toast: Toast | undefined;
      let isCancelled = false; // Flag to prevent state updates after unmount

      try {
        setIsLoading(true);
        setError(null);

        // Get preferences
        const preferences = getPreferenceValues<Preferences>();
        const { geminiApiKey, geminiModel } = preferences;

        // Validate API key format
        if (!geminiApiKey || !isValidApiKeyFormat(geminiApiKey)) {
          throw new Error(ERROR_MESSAGES.API_KEY_INVALID_FORMAT);
        }

        // Get text to translate
        let textToTranslate = "";
        let usedClipboard = false;

        try {
          // Try to get selected text first
          textToTranslate = await getSelectedText();
        } catch {
          // If no text is selected, try clipboard
          try {
            const clipboardText = await Clipboard.readText();
            if (clipboardText && clipboardText.trim().length > 0) {
              textToTranslate = clipboardText;
              usedClipboard = true;
            }
          } catch {
            // Clipboard also failed
          }
        }

        if (!textToTranslate || textToTranslate.trim().length === 0) {
          throw new Error(ERROR_MESSAGES.NO_TEXT_TO_TRANSLATE);
        }

        // Pre-check text length to provide early feedback (UI-level check)
        // Note: This is checked again in translateToJapanese() for safety (API-level check)
        // - UI check: Provides immediate user feedback before API call
        // - API check: Ensures safety even if called from other contexts
        const trimmedText = textToTranslate.trim();
        if (trimmedText.length > MAX_TEXT_LENGTH) {
          throw new Error(ERROR_MESSAGES.TEXT_TOO_LONG(trimmedText.length));
        }

        if (!isCancelled) {
          setOriginalText(textToTranslate);
        }

        // Show translating toast with retry info
        toast = await showToast({
          style: Toast.Style.Animated,
          title: "Translating...",
          message: usedClipboard
            ? `Using clipboard (${geminiModel}, auto-retry enabled)`
            : `Using ${geminiModel} (auto-retry enabled)`,
        });

        // Translate the text
        const translated = await translateToJapanese(textToTranslate, geminiApiKey, geminiModel);

        // Only update state if component is still mounted
        if (!isCancelled) {
          setTranslatedText(translated);

          // Update toast to success
          // When toast has Animated style, it should be in loading state
          if (toast) {
            toast.style = Toast.Style.Success;
            toast.title = "Translation completed!";
            toast.message = undefined;
          }
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
          setError(errorMessage);

          // Show or update toast with error
          if (toast) {
            toast.style = Toast.Style.Failure;
            toast.title = "Translation failed";
            toast.message = errorMessage.split("\n")[0]; // First line only for toast
          } else {
            await showToast({
              style: Toast.Style.Failure,
              title: "Translation failed",
              message: errorMessage.split("\n")[0],
            });
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }

      // Return cleanup function
      return () => {
        isCancelled = true;
      };
    }

    const cleanup = translate();

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup.then((cleanupFn) => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, []);

  if (error) {
    const isQuotaError = error.includes("quota") || error.includes("RESOURCE_EXHAUSTED") || error.includes("429");

    return (
      <Detail
        markdown={`# ❌ Translation Error

${error}

## Troubleshooting

1. **API Key Issues**
   - Make sure you have a valid Gemini API key
   - Get your API key from: https://makersuite.google.com/app/apikey
   - Set it in Raycast preferences for this extension

2. **Quota/Rate Limit Issues** ${isQuotaError ? "⚠️ *Detected*" : ""}
   - The extension automatically retries with exponential backoff
   - It will also try alternative models (Gemini 1.5 Flash, 1.5 Pro) if quota is exceeded
   - If all models fail, try again in a few minutes
   - Check your quota at: https://console.cloud.google.com/
   - Learn about rate limits: https://ai.google.dev/gemini-api/docs/rate-limits

3. **Text Selection**
   - Select text before running this command
   - Or copy text to clipboard

4. **Network Issues**
   - Check your internet connection
   - Verify that you can access Google APIs
`}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser title="Get Gemini Api Key" url="https://makersuite.google.com/app/apikey" />
            <Action.Open title="Open Raycast Preferences" target="raycast://extensions/preferences" />
            {isQuotaError && (
              <>
                <Action.OpenInBrowser
                  title="Check API Quota"
                  url="https://console.cloud.google.com/"
                  shortcut={{ modifiers: ["cmd"], key: "q" }}
                />
                <Action.OpenInBrowser
                  title="Learn About Rate Limits"
                  url="https://ai.google.dev/gemini-api/docs/rate-limits"
                  shortcut={{ modifiers: ["cmd"], key: "l" }}
                />
              </>
            )}
          </ActionPanel>
        }
      />
    );
  }

  if (isLoading) {
    return <Detail isLoading={true} markdown="# Translating...\n\nPlease wait while we translate your text." />;
  }

  const markdown = `# 翻訳結果 / Translation Result

## 日本語 (Japanese)

${translatedText}

---

## 原文 (Original)

${originalText}
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Translation"
            content={translatedText}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy Both (original + Translation)"
            content={`Original:\n${originalText}\n\nTranslation:\n${translatedText}`}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action.Paste
            title="Paste Translation"
            content={translatedText}
            shortcut={{ modifiers: ["cmd"], key: "v" }}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Original Length" text={`${originalText.length} characters`} />
          <Detail.Metadata.Label title="Translation Length" text={`${translatedText.length} characters`} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Status" text="✅ Completed" />
        </Detail.Metadata>
      }
    />
  );
}
