import { Detail, getPreferenceValues, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useRef } from "react";
import { isQuotaError } from "./utils/translation-provider";
import { translateText } from "./services/translation-service";
import {
  PROVIDERS,
  GEMINI_MODELS,
  GROQ_MODELS,
  VALID_GEMINI_MODELS,
  VALID_GROQ_MODELS,
  isValidGeminiModel,
  isValidGroqModel,
  isValidProvider,
  getModelDisplayName,
  DEFAULT_PROVIDER,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  type ProviderName,
  type GeminiModelName,
  type GroqModelName,
  type ModelName,
} from "./constants";

/**
 * User preferences interface for the extension
 */
interface Preferences {
  provider: ProviderName;
  geminiApiKey: string;
  geminiModel: GeminiModelName;
  groqApiKey: string;
  groqModel: GroqModelName;
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
  const preferences = getPreferenceValues<Preferences>();
  const {
    provider: preferredProvider,
    geminiApiKey,
    geminiModel: preferredGeminiModel,
    groqApiKey,
    groqModel: preferredGroqModel,
  } = preferences;

  const [isLoading, setIsLoading] = useState(true);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Ref to track if the user has explicitly overridden provider/model
  const userOverrodeRef = useRef(false);

  // Ref to track whether the component has been unmounted/cancelled
  const isCancelledRef = useRef(false);

  // Initialize provider state
  const [currentProvider, setCurrentProvider] = useState<ProviderName>(() => {
    return isValidProvider(preferredProvider) ? preferredProvider : DEFAULT_PROVIDER;
  });

  // Initialize model state based on provider
  const [currentModel, setCurrentModel] = useState<ModelName>(() => {
    const provider = isValidProvider(preferredProvider) ? preferredProvider : DEFAULT_PROVIDER;
    if (provider === PROVIDERS.GEMINI) {
      return isValidGeminiModel(preferredGeminiModel) ? preferredGeminiModel : DEFAULT_GEMINI_MODEL;
    }
    return isValidGroqModel(preferredGroqModel) ? preferredGroqModel : DEFAULT_GROQ_MODEL;
  });

  // Effect to update provider/model when preferences change
  useEffect(() => {
    if (!userOverrodeRef.current) {
      const normalizedProvider = isValidProvider(preferredProvider) ? preferredProvider : DEFAULT_PROVIDER;

      if (currentProvider !== normalizedProvider) {
        setCurrentProvider(normalizedProvider);
      }

      // Update model based on provider
      let normalizedModel: ModelName;
      if (normalizedProvider === PROVIDERS.GEMINI) {
        normalizedModel = isValidGeminiModel(preferredGeminiModel) ? preferredGeminiModel : DEFAULT_GEMINI_MODEL;
      } else {
        normalizedModel = isValidGroqModel(preferredGroqModel) ? preferredGroqModel : DEFAULT_GROQ_MODEL;
      }

      if (currentModel !== normalizedModel) {
        setCurrentModel(normalizedModel);
      }
    }
  }, [preferredProvider, preferredGeminiModel, preferredGroqModel, currentProvider, currentModel]);

  useEffect(() => {
    // Reset cancelled flag on mount
    isCancelledRef.current = false;

    /**
     * Main translation logic
     *
     * Flow:
     * 1. Get preferences (API key, model)
     * 2. Validate and normalize model name
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

        // Show translating toast
        toast = await showToast({
          style: Toast.Style.Animated,
          title: "Translating...",
        });

        // Get appropriate API key based on provider
        const apiKey = currentProvider === PROVIDERS.GEMINI ? geminiApiKey : groqApiKey;

        // Translate the text using translation service
        const result = await translateText(
          {
            provider: currentProvider,
            apiKey,
            model: currentModel,
            originalText: originalText || undefined,
          },
          (message, fromClipboard) => {
            // Update toast with progress
            if (toast) {
              toast.message = fromClipboard ? `Using clipboard (${message})` : message;
            }
          },
        );

        // Only update state if component is still mounted
        if (!isCancelledRef.current) {
          setOriginalText(result.originalText);
          setTranslatedText(result.translatedText);

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
  }, [currentProvider, currentModel, geminiApiKey, groqApiKey]);

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
   - It will also try alternative models (Gemini 2.5 Flash Lite, 2.5 Pro) if quota is exceeded
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
                  title="Check Api Quota"
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

  const markdown = translatedText;

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
          <Action.Paste
            title="Paste Translation"
            content={translatedText}
            shortcut={{ modifiers: ["cmd"], key: "v" }}
          />
          <ActionPanel.Submenu
            title="Switch Provider & Model"
            icon="🔄"
            shortcut={{ modifiers: ["cmd"], key: "m" }}
          >
            <ActionPanel.Section title="Gemini Models">
              {VALID_GEMINI_MODELS.map((model) => (
                <Action
                  key={model}
                  title={`${getModelDisplayName(model, PROVIDERS.GEMINI)}${
                    currentProvider === PROVIDERS.GEMINI && currentModel === model ? " (Current)" : ""
                  }`}
                  onAction={() => {
                    userOverrodeRef.current = true;
                    setCurrentProvider(PROVIDERS.GEMINI);
                    setCurrentModel(model);
                  }}
                />
              ))}
            </ActionPanel.Section>
            <ActionPanel.Section title="Groq Models">
              {VALID_GROQ_MODELS.map((model) => (
                <Action
                  key={model}
                  title={`${getModelDisplayName(model, PROVIDERS.GROQ)}${
                    currentProvider === PROVIDERS.GROQ && currentModel === model ? " (Current)" : ""
                  }`}
                  onAction={() => {
                    userOverrodeRef.current = true;
                    setCurrentProvider(PROVIDERS.GROQ);
                    setCurrentModel(model);
                  }}
                />
              ))}
            </ActionPanel.Section>
          </ActionPanel.Submenu>
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Original Length" text={`${originalText.length} characters`} />
          <Detail.Metadata.Label title="Translation Length" text={`${translatedText.length} characters`} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Provider"
            text={currentProvider === PROVIDERS.GEMINI ? "Google Gemini" : "Groq"}
          />
          <Detail.Metadata.Label
            title="Model"
            text={currentModel ? getModelDisplayName(currentModel, currentProvider) : "Unknown"}
          />
          <Detail.Metadata.Label title="Status" text="✅ Completed" />
        </Detail.Metadata>
      }
    />
  );
}
