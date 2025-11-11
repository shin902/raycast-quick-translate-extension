import { Detail, getSelectedText, AI, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";

export default function TranslateSelectedText() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAndTranslate() {
      try {
        // Get selected text
        const text = await getSelectedText();

        if (!text || text.trim().length === 0) {
          setError("No text selected. Please select some text and try again.");
          setIsLoading(false);
          return;
        }

        setSelectedText(text);

        // Show loading toast
        await showToast({
          style: Toast.Style.Animated,
          title: "Translating...",
        });

        // Translate using AI
        const prompt = `Translate the following text to Japanese. Only provide the translation without any explanations or additional text:\n\n${text}`;

        const translation = await AI.ask(prompt, {
          model: "openai-gpt-4o-mini",
        });

        setTranslatedText(translation.trim());

        // Show success toast
        await showToast({
          style: Toast.Style.Success,
          title: "Translation Complete",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(`Failed to translate: ${errorMessage}`);

        await showToast({
          style: Toast.Style.Failure,
          title: "Translation Failed",
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndTranslate();
  }, []);

  if (error) {
    return (
      <Detail
        markdown={`# ❌ Error\n\n${error}`}
      />
    );
  }

  if (isLoading) {
    return <Detail isLoading={true} markdown="# Translating..." />;
  }

  const markdown = `# 📝 Selected Text

\`\`\`
${selectedText}
\`\`\`

---

# 🇯🇵 Japanese Translation

${translatedText}
`;

  return <Detail markdown={markdown} />;
}
