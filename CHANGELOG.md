# Changelog

All notable changes to the Raycast Quick Translate extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Placeholder icon.png** (512x512px light blue gradient)
- API timeout protection (30 seconds) with proper cleanup to prevent memory leaks
- Input sanitization to remove problematic characters and normalize text
  - Unicode normalization (NFC form)
  - Control character removal
  - Zero-width character removal
- Enhanced prompt injection protection with stronger delimiters
- Text length pre-check in UI for early user feedback
- Constants file for centralized configuration management
- Comprehensive JSDoc documentation for all functions
- Node.js and npm engine requirements in package.json
- Detailed README sections:
  - Example translations with input/output
  - API costs and quotas information
  - Extended troubleshooting guide (Raycast permissions, timeouts)
  - Known limitations section
- Explanatory comments for duplicate text length checks

### Changed
- Improved API key validation with flexible pattern matching
- Enhanced error messages with detailed context and troubleshooting links
- Refactored constants to separate file for better maintainability
- Updated API key validation comments with official documentation references
- **Timeout implementation** now properly cleans up timers to prevent memory leaks
- Magic numbers extracted to named constants (MAX_CONSECUTIVE_SPACES)
- Toast mutation handling improved with validity checks and fallback
- Prompt template enhanced with explicit instructions to prevent injection

### Fixed
- **Critical**: Added missing icon.png asset file (blocker issue resolved)
- **High Priority**: Memory leak from uncleaned timeout timers
- Toast message race conditions with better state checking
- Type safety for Gemini API responses with null checks
- Potential race condition in toast updates

## [0.1.0] - 2025-01-14

### Added
- Initial Phase 1 implementation
- Text translation from selected text to Japanese
- Clipboard fallback when no text is selected
- Multiple Gemini model selection (2.0 Flash, 1.5 Pro, 1.5 Flash)
- Comprehensive error handling and user feedback
- Keyboard shortcuts for copy and paste actions
- Translation metadata display (character counts, status)
- Support for mixed language content
- API key format validation

### Features
- **Text Translation**: Translate selected text or clipboard content to Japanese
- **Model Selection**: Choose between Gemini 2.0 Flash (Experimental), 1.5 Pro, or 1.5 Flash
- **Smart Fallback**: Automatically uses clipboard if no text is selected
- **User-Friendly UI**: Clean interface with detailed results and actions
- **Error Handling**: Comprehensive error messages with troubleshooting guidance

### Technical
- Built with TypeScript for type safety
- React-based UI using Raycast API
- Google Gemini API integration
- ESLint and Prettier configuration
- Comprehensive documentation (README, CLAUDE.md, RAYCAST_EXTENSION_GUIDE.md)

## Known Limitations

- Maximum text length: 10,000 characters
- Requires stable internet connection for API calls
- API key must be obtained from Google AI Studio
- Currently supports translation to Japanese only

## Upcoming Features (Phase 2)

- Screenshot translation with OCR (Tesseract.js)
- Support for multiple target languages
- Translation history
- Batch translation support

---

## Release Notes Format

Each release includes:
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
