import { Detail, Clipboard, AI, showToast, Toast, showHUD, closeMainWindow } from "@raycast/api";
import { useEffect, useState } from "react";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const execAsync = promisify(exec);

export default function TranslateFromScreenshot() {
  const [isLoading, setIsLoading] = useState(true);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function captureAndTranslate() {
      let tempFilePath: string | null = null;

      try {
        // Close main window and show HUD
        await closeMainWindow();
        await showHUD("Select area to capture...");

        // Create temp file for screenshot
        tempFilePath = path.join(os.tmpdir(), `raycast-screenshot-${Date.now()}.png`);

        // Capture screenshot using macOS screencapture
        // -i: interactive (user selects area)
        // -s: screenshot mode
        await execAsync(`screencapture -i -s "${tempFilePath}"`);

        // Check if file was created (user might have cancelled)
        if (!fs.existsSync(tempFilePath)) {
          setError("Screenshot cancelled or failed");
          setIsLoading(false);
          return;
        }

        await showToast({
          style: Toast.Style.Animated,
          title: "Processing screenshot...",
        });

        // Read screenshot file
        const imageBuffer = fs.readFileSync(tempFilePath);
        const base64Image = imageBuffer.toString("base64");

        // Use AI to extract text and translate (GPT-4o supports vision)
        const prompt = `This is a screenshot. Please:
1. Extract all visible text from this image (OCR)
2. Translate the extracted text to Japanese

Format your response as:
--- Extracted Text ---
[extracted text here]

--- Japanese Translation ---
[translation here]`;

        await showToast({
          style: Toast.Style.Animated,
          title: "Extracting and translating...",
        });

        const response = await AI.ask(prompt, {
          model: "openai-gpt-4o-mini",
          // @ts-ignore - Raycast API might support image input
          image: {
            base64: base64Image,
          },
        });

        // Parse response
        const extractedMatch = response.match(/---\s*Extracted Text\s*---\s*([\s\S]*?)(?=---\s*Japanese Translation\s*---|$)/i);
        const translatedMatch = response.match(/---\s*Japanese Translation\s*---\s*([\s\S]*?)$/i);

        if (extractedMatch && translatedMatch) {
          setExtractedText(extractedMatch[1].trim());
          setTranslatedText(translatedMatch[1].trim());
        } else {
          // If parsing fails, show the raw response
          setExtractedText("(Parsing failed, showing raw response)");
          setTranslatedText(response);
        }

        await showToast({
          style: Toast.Style.Success,
          title: "Translation Complete",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(`Failed to process screenshot: ${errorMessage}`);

        await showToast({
          style: Toast.Style.Failure,
          title: "Processing Failed",
          message: errorMessage,
        });
      } finally {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch {
            // Ignore cleanup errors
          }
        }
        setIsLoading(false);
      }
    }

    captureAndTranslate();
  }, []);

  if (error) {
    return (
      <Detail
        markdown={`# ❌ Error\n\n${error}`}
      />
    );
  }

  if (isLoading) {
    return <Detail isLoading={true} markdown="# Processing screenshot..." />;
  }

  const markdown = `# 📸 Extracted Text (OCR)

\`\`\`
${extractedText}
\`\`\`

---

# 🇯🇵 Japanese Translation

${translatedText}
`;

  return <Detail markdown={markdown} />;
}
