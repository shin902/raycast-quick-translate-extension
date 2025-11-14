# Quick Translate - Raycast Extension

Translate selected text to Japanese using Google Gemini API.

## Features

- 🚀 Quick translation of selected text to Japanese
- 📋 Fallback to clipboard if no text is selected
- 🤖 Powered by Google Gemini API (gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash)
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

## Configuration

### Gemini Model Selection

You can choose which Gemini model to use in the extension preferences:

- **Gemini 2.0 Flash (Experimental)** - Latest and fastest model (default)
- **Gemini 1.5 Pro** - High accuracy and complex tasks
- **Gemini 1.5 Flash** - Fast and efficient

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
