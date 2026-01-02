/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `translate-text` command */
  export type TranslateText = ExtensionPreferences & {
  /** Translation Provider - Select the AI provider to use for translation */
  "provider": "gemini" | "groq",
  /** Gemini API Key - Your Google Gemini API key from https://makersuite.google.com/app/apikey */
  "geminiApiKey"?: string,
  /** Gemini Model - Select the Gemini model to use for translation */
  "geminiModel": "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite",
  /** Groq API Key - Your Groq API key from https://console.groq.com/keys */
  "groqApiKey"?: string,
  /** Groq Model - Select the Groq model to use for translation */
  "groqModel": "llama-3.3-70b-versatile" | "llama-3.1-70b-versatile" | "mixtral-8x7b-32768" | "openai/gpt-oss-120b" | "openai/gpt-oss-20b"
}
}

declare namespace Arguments {
  /** Arguments passed to the `translate-text` command */
  export type TranslateText = {}
}

