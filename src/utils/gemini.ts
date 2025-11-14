import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Translate text to Japanese using Google Gemini API
 * @param text - The text to translate
 * @param apiKey - Google Gemini API key
 * @param modelName - The Gemini model to use (default: gemini-2.0-flash-exp)
 * @returns Translated text in Japanese
 */
export async function translateToJapanese(
  text: string,
  apiKey: string,
  modelName: string = "gemini-2.0-flash-exp",
): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text to translate cannot be empty");
  }

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Gemini API key is required");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `以下のテキストを日本語に翻訳してください。翻訳結果のみを返し、説明や注釈は不要です：

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();

    if (!translatedText || translatedText.trim().length === 0) {
      throw new Error("Translation result is empty");
    }

    return translatedText.trim();
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes("API key")) {
        throw new Error("Invalid API key. Please check your Gemini API key in preferences.");
      }
      if (error.message.includes("quota")) {
        throw new Error("API quota exceeded. Please try again later.");
      }
      if (error.message.includes("model")) {
        throw new Error("Invalid model selected. Please check your model preference.");
      }
      throw new Error(`Translation failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during translation");
  }
}

/**
 * Validate if the API key format is correct
 * @param apiKey - The API key to validate
 * @returns true if the format appears valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Gemini API keys typically start with "AI" and are at least 30 characters
  return apiKey.trim().length >= 30 && /^[A-Za-z0-9_-]+$/.test(apiKey);
}
