import {
  Detail,
  getPreferenceValues,
  getSelectedText,
  Clipboard,
  ActionPanel,
  Action,
  showToast,
  Toast,
  LaunchProps,
} from "@raycast/api";
import { useEffect, useState, useRef } from "react";
import { translateToJapanese, isValidApiKeyFormat, isQuotaError } from "./utils/gemini";
import {
  MAX_TEXT_LENGTH,
  ERROR_MESSAGES,
  GEMINI_MODELS,
  VALID_GEMINI_MODELS,
  isValidGeminiModel,
  getModelDisplayName,
  type GeminiModelName,
} from "./constants";

/**
 * User preferences interface for the extension
 */
interface Preferences {
  geminiApiKey: string;
  geminiModel: GeminiModelName;
}

/**
 * Command arguments interface
 */
interface Arguments {
  model?: GeminiModelName;
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
 * @param props - Launch props containing command arguments
 * @returns React component that displays translation results or errors
 */
export default function TranslateText(props: LaunchProps<{ arguments: Arguments }>) {
  const [isLoading, setIsLoading] = useState(true);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<GeminiModelName | null>(null);
  const isCancelledRef = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Reset cancelled flag on mount
    isCancelledRef.current = false;

    /**
     * Main translation logic
     *
     * Flow:
     * 1. Get preferences (API key, model)
     * 2. Get model from arguments (if provided) or fallback to preferences
     * 3. Validate API key format
     * 4. Get text from selection (or fallback to clipboard) - only on initial mount
     * 5. Call translation API
     * 6. Display results or errors
     */
    async function translate() {
      let toast: Toast | undefined;

      try {
        setIsLoading(true);
        setError(null);

        // Get preferences
        const preferences = getPreferenceValues<Preferences>();
        const { geminiApiKey, geminiModel } = preferences;

        // Determine which model to use
        let normalizedModel: GeminiModelName;

        if (isInitialMount.current) {
          // First mount: Get model from arguments or preferences
          const modelFromArgs = props.arguments?.model;
          const selectedModel = modelFromArgs || geminiModel;

          // Validate and normalize model name
          if (isValidGeminiModel(selectedModel)) {
            normalizedModel = selectedModel;
          } else {
            // Invalid model - log warning and fallback to default
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `[QuickTranslate] Invalid model '${selectedModel}', falling back to ${GEMINI_MODELS.FLASH_2_5}`,
                "\nValid models:",
                VALID_GEMINI_MODELS,
              );
            }
            normalizedModel = GEMINI_MODELS.FLASH_2_5;

            // Show brief toast to inform user about fallback
            await showToast({
              style: Toast.Style.Warning,
              title: "Model Fallback",
              message: `Invalid model selected, using ${GEMINI_MODELS.FLASH_2_5}`,
            });
          }

          // Set the current model for future re-translations
          setCurrentModel(normalizedModel);
          isInitialMount.current = false;
        } else {
          // Re-translation: Use the currentModel state
          if (!currentModel) {
            throw new Error("Model not initialized");
          }
          normalizedModel = currentModel;
        }

        // Validate API key format
        if (!geminiApiKey || !isValidApiKeyFormat(geminiApiKey)) {
          throw new Error(ERROR_MESSAGES.API_KEY_INVALID_FORMAT);
        }

        // Get text to translate (only on initial mount, otherwise use stored originalText)
        let textToTranslate = "";
        let usedClipboard = false;

        if (isInitialMount.current || !originalText) {
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
          const trimmedText = textToTranslate.trim();
          if (trimmedText.length > MAX_TEXT_LENGTH) {
            throw new Error(ERROR_MESSAGES.TEXT_TOO_LONG(trimmedText.length));
          }

          if (!isCancelledRef.current) {
            setOriginalText(textToTranslate);
          }
        } else {
          // Re-translation: Use the stored original text
          textToTranslate = originalText;
        }

        // Show translating toast
        toast = await showToast({
          style: Toast.Style.Animated,
          title: "Translating...",
          message: usedClipboard
            ? `Using clipboard (${normalizedModel}, auto-retry enabled)`
            : `Using ${normalizedModel} (auto-retry enabled)`,
        });

        // Translate the text
        const translated = await translateToJapanese(textToTranslate, geminiApiKey, normalizedModel);

        // Only update state if component is still mounted
        if (!isCancelledRef.current) {
          setTranslatedText(translated);

          // Update toast to success
          if (toast) {
            toast.style = Toast.Style.Success;
            toast.title = "Translation completed!";
            toast.message = undefined;
          }
        }
      } catch (err) {
        if (!isCancelledRef.current) {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
          setError(errorMessage);

          // Show or update toast with error
          if (toast) {
            toast.style = Toast.Style.Failure;
            toast.title = "Translation failed";
            toast.message = errorMessage.split("\n")[0];
          } else {
            await showToast({
              style: Toast.Style.Failure,
              title: "Translation failed",
              message: errorMessage.split("\n")[0],
            });
          }
        }
      } finally {
        if (!isCancelledRef.current) {
          setIsLoading(false);
        }
      }
    }

    translate();

    // Cleanup on unmount
    return () => {
      isCancelledRef.current = true;
    };
    // Re-run translation when currentModel changes (for model switching)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModel]);

  if (error) {
    const errorObject = new Error(error);
    const isQuotaErrorDetected = isQuotaError(errorObject);

    return (
      <Detail
        markdown={`# ❌ Translation Error

${error}

## Troubleshooting

1. **API Key Issues**
   - Make sure you have a valid Gemini API key
   - Get your API key from: https://makersuite.google.com/app/apikey
   - Set it in Raycast preferences for this extension

2. **Quota/Rate Limit Issues** ${isQuotaErrorDetected ? "⚠️ *Detected*" : ""}
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
            {isQuotaErrorDetected && (
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

  const markdown = `# 翻訳結果

${translatedText}
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
          <ActionPanel.Submenu
            title="Switch Model & Re-translate"
            icon="🔄"
            shortcut={{ modifiers: ["cmd"], key: "m" }}
          >
            {VALID_GEMINI_MODELS.map((model) => (
              <Action
                key={model}
                title={`${getModelDisplayName(model)}${currentModel === model ? " (Current)" : ""}`}
                onAction={() => {
                  if (currentModel !== model) {
                    setCurrentModel(model);
                  }
                }}
              />
            ))}
          </ActionPanel.Submenu>
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Original Length" text={`${originalText.length} characters`} />
          <Detail.Metadata.Label title="Translation Length" text={`${translatedText.length} characters`} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Model" text={currentModel ? getModelDisplayName(currentModel) : "Unknown"} />
          <Detail.Metadata.Label title="Status" text="✅ Completed" />
        </Detail.Metadata>
      }
    />
  );
}
