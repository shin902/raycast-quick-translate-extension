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

interface Preferences {
  geminiApiKey: string;
  geminiModel: string;
}

export default function TranslateText() {
  const [isLoading, setIsLoading] = useState(true);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function translate() {
      try {
        setIsLoading(true);
        setError(null);

        // Get preferences
        const preferences = getPreferenceValues<Preferences>();
        const { geminiApiKey, geminiModel } = preferences;

        // Validate API key format
        if (!geminiApiKey || !isValidApiKeyFormat(geminiApiKey)) {
          throw new Error(
            "Invalid API key format. Please set a valid Gemini API key in preferences.\n\nGet your API key from: https://makersuite.google.com/app/apikey",
          );
        }

        // Get text to translate
        let textToTranslate = "";

        try {
          // Try to get selected text first
          textToTranslate = await getSelectedText();
        } catch {
          // If no text is selected, try clipboard
          try {
            const clipboardText = await Clipboard.readText();
            if (clipboardText && clipboardText.trim().length > 0) {
              textToTranslate = clipboardText;
              await showToast({
                style: Toast.Style.Animated,
                title: "No text selected",
                message: "Using clipboard content instead",
              });
            }
          } catch {
            // Clipboard also failed
          }
        }

        if (!textToTranslate || textToTranslate.trim().length === 0) {
          throw new Error(
            "No text to translate.\n\nPlease either:\n1. Select text before running this command, or\n2. Copy text to clipboard",
          );
        }

        setOriginalText(textToTranslate);

        // Show translating toast
        await showToast({
          style: Toast.Style.Animated,
          title: "Translating...",
          message: `Using ${geminiModel}`,
        });

        // Translate the text
        const translated = await translateToJapanese(textToTranslate, geminiApiKey, geminiModel);
        setTranslatedText(translated);

        // Show success toast
        await showToast({
          style: Toast.Style.Success,
          title: "Translation completed!",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);

        await showToast({
          style: Toast.Style.Failure,
          title: "Translation failed",
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }

    translate();
  }, []);

  if (error) {
    return (
      <Detail
        markdown={`# ❌ Translation Error

${error}

## Troubleshooting

1. **API Key Issues**
   - Make sure you have a valid Gemini API key
   - Get your API key from: https://makersuite.google.com/app/apikey
   - Set it in Raycast preferences for this extension

2. **Text Selection**
   - Select text before running this command
   - Or copy text to clipboard

3. **Network Issues**
   - Check your internet connection
   - Verify that you can access Google APIs
`}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser title="Get Gemini API Key" url="https://makersuite.google.com/app/apikey" />
            <Action.Open title="Open Raycast Preferences" target="raycast://extensions/preferences" />
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
            title="Copy Both (Original + Translation)"
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
