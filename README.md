# Quick Translate - Raycast Extension

Translate selected text to Japanese using Google Gemini API.

## Features

- 🚀 Quick translation of selected text to Japanese
- 📋 Fallback to clipboard if no text is selected
- 🤖 Powered by Google Gemini API (gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite)
- 📝 Copy translation with keyboard shortcuts
- ✨ Clean and intuitive UI with detailed results

## Installation

### Prerequisites

- macOS
- Raycast 1.26.0 or later
- Node.js 22.14 or later
- Google Gemini API Key

### Setup

1. Clone this repository:
```bash
git clone https://github.com/shin902/raycast-quick-translate-extension.git
cd raycast-quick-translate-extension
```

2. Install dependencies:
```bash
npm install
```

3. Get your Gemini API Key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key
   - **⚠️ Security Note**:
     - Never commit your API key to version control
     - Keep your API key confidential
     - If exposed, immediately regenerate it at Google AI Studio
     - Raycast stores API keys securely in the macOS Keychain

4. Add an icon:
```bash
# You need to create or add an icon.png file (512x512px) to the assets/ directory
# See assets/README.md for detailed instructions
```

5. Start development mode:
```bash
npm run dev
```

6. In Raycast, open the extension preferences and set your Gemini API Key

## Usage

1. Select any text in any application
2. Open Raycast (⌘ + Space)
3. Type "Translate to Japanese" or search for this extension
4. Press Enter

The extension will:
- Translate the selected text to Japanese
- Display the translation and original text
- Provide actions to copy or paste the translation

### Keyboard Shortcuts

- `⌘ + C` - Copy translation only
- `⌘ + Shift + C` - Copy both original and translation
- `⌘ + V` - Paste translation

### If No Text is Selected

The extension will automatically try to use the clipboard content as a fallback.

### Example Translation

**Input (English)**:
```
Hello, world! How are you today?
```

**Output (Japanese)**:
```
こんにちは、世界！今日はお元気ですか？
```

The extension also handles:
- Mixed language content (translates only non-Japanese parts)
- Already Japanese text (returns as-is)
- Long texts (up to 10,000 characters)

## Configuration

### Gemini Model Selection

You can choose which Gemini model to use in the extension preferences:

- **Gemini 2.5 Flash Lite** - Fastest and most lightweight (default)
- **Gemini 2.5 Flash** - Balanced speed and accuracy
- **Gemini 2.5 Pro** - High accuracy for complex tasks

## Development

### Project Structure

```
raycast-quick-translate-extension/
├── assets/
│   └── icon.png              # Extension icon (add your own)
├── src/
│   ├── translate-text.tsx    # Main translation command
│   └── utils/
│       └── gemini.ts         # Gemini API client
├── package.json              # Manifest and dependencies
└── tsconfig.json             # TypeScript configuration
```

### Commands

```bash
# Start development mode with hot reload
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run fix-lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Publish to Raycast Store
npm run publish
```

## Troubleshooting

### "No text to translate" error

Make sure to either:
1. Select text before running the command, or
2. Copy text to your clipboard

### "Invalid API key" error

1. Check that you've set the API key in Raycast preferences
2. Verify the API key is correct at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Make sure the API key has the necessary permissions

### Translation fails

1. Check your internet connection
2. Verify you can access Google APIs
3. Check if you've exceeded API quota (free tier has limits)
4. Try a different Gemini model (switch between Flash and Pro)

### Raycast permission issues

If the extension can't access selected text:
1. Open **System Settings** > **Privacy & Security** > **Accessibility**
2. Ensure **Raycast** is in the list and enabled
3. If not, click the "+" button and add Raycast
4. Restart Raycast after granting permissions

### Translation timeout

If translations timeout (after 30 seconds):
1. Try shorter text (under 5,000 characters recommended)
2. Check your network connection speed
3. Switch to a faster model (gemini-2.5-flash-lite)

## API Costs & Quotas

### Gemini API Pricing

The Google Gemini API offers a **generous free tier**:

- **Free tier**: 15 requests per minute (RPM)
- **Free tier**: 1 million tokens per day
- **Character limit**: 10,000 characters per request (extension limit)

For most personal use cases, the free tier is sufficient. See [official pricing](https://ai.google.dev/pricing) for details.

### Cost Estimation

**Example usage** (free tier):
- ~500 translations/day (average 100 words each)
- Suitable for personal translation needs
- No credit card required for free tier

**Paid tier** (if needed):
- See [current pricing](https://ai.google.dev/pricing) for updates on Gemini 2.5 models

### Monitoring Usage

Check your API usage at:
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Google Cloud Console](https://console.cloud.google.com/)

## Known Limitations

- **Maximum text length**: 10,000 characters per translation
- **Network dependency**: Requires stable internet connection
- **Translation accuracy**: Depends on Gemini model quality
- **Language support**: Currently supports translation to Japanese only
- **API rate limits**: 15 requests/minute on free tier
- **Timeout behavior**: If translation times out (30s), the API request continues in the background and consumes quota. The Gemini API library does not support request cancellation.
- **Component lifecycle**: Translation continues even if you navigate away. Consider waiting for completion before switching views.

## Phase 2 (Future)

Planned features for the next phase:

- 📸 Screenshot translation with OCR
- 🌍 Support for multiple target languages
- 💾 Translation history
- ⚡ Batch translation

## License

MIT

## Author

shin902

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Raycast Developers](https://developers.raycast.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Project Documentation](./CLAUDE.md)
