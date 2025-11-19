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
  /** Gemini API Key - Your Google Gemini API key from https://makersuite.google.com/app/apikey */
  "geminiApiKey": string,
  /** Gemini Model - Select the Gemini model to use for translation */
  "geminiModel": "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite"
}
}

declare namespace Arguments {
  /** Arguments passed to the `translate-text` command */
  export type TranslateText = {
  /** Choose model (optional) */
  "model": "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite"
}
}

