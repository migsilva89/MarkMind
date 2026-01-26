# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style Guidelines

- **Keep code clean** - No dated changelog comments (e.g., `// 24 JANUARY: Added X`). Git history tracks changes.
- **Helpful comments are welcome** - Short comments explaining "why" something is done are good practice:
  ```javascript
  // Fallback for restricted pages (chrome://, etc.)
  // Get tab ID to inject script (activeTab grants access on user click)
  ```
- **Use modern JavaScript** - async/await, optional chaining, nullish coalescing, object destructuring.
- **Data-driven patterns** - Prefer configuration objects over if/else chains for scalability.
- **Use CSS variables** - Always use design tokens from `:root`, never hardcode pixel values.
- **Minimal permissions** - Only request Chrome permissions that are absolutely necessary.

## Session End Protocol

At the end of each coding session, or when the developer requests "update changelog", Claude MUST:
1. Update `CHANGELOG.md` with all changes made during the session
2. Include: date, features added, UI changes, bug fixes, and files modified
3. Document ALL manifest.json changes (permissions, host_permissions, etc.)
4. Follow the existing CHANGELOG format with dated sections

**Triggers for changelog update:**
- Developer says "update changelog" or "session done"
- Developer indicates they are stopping work
- Before creating a commit or PR
- When explicitly requested

## Project Overview

MarkMind is a Chrome extension that uses AI to intelligently organize bookmarks. It supports multiple AI providers (Google Gemini, OpenAI, Anthropic, OpenRouter) and automatically categorizes bookmarks into appropriate folders.

## Development Setup

This is a vanilla JavaScript Chrome extension (Manifest V3) with no build process or package manager.

### Loading the Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src` folder

### Testing Changes

After making changes, reload the extension in Chrome (click the refresh icon on the extension card in `chrome://extensions/`).

## Architecture

The codebase follows a modular architecture with singleton instances for managers, services, and UI components.

### Entry Point

**popup.js** - Application entry point. Initializes all modules and sets up event handlers.

### Managers (Singleton Pattern)

- **StateManager** - Centralized state with observable pattern
- **OrganizationManager** - Orchestrates the organization workflow
- **BookmarkTreeManager** - Renders the bookmark tree UI with checkboxes
- **SettingsManager** - API key management and settings panel visibility
- **UIManager** - DOM element caching and status message display

### Services (Singleton Pattern)

- **geminiService** - AI integration for bookmark organization suggestions
- **bookmarkService** - Wraps Chrome Bookmarks API
- **storageService** - Wraps Chrome Storage API for API key persistence

### Configuration

- **config/services.js** - AI service configurations (endpoints, headers, validation, test configs)
- **config/api.js** - API URL and model settings
- **config/constants.js** - Chrome native folder IDs, limits, UI states

### Chrome APIs Used

- `chrome.bookmarks` - Tree operations, create, move, search
- `chrome.storage.local` - API key persistence
- `chrome.scripting` - Content script injection for metadata extraction
- `chrome.tabs` - Get active tab ID (via activeTab permission)

### Business Rules

- Maximum folder depth: 3 levels
- Chrome native folders: Bookmarks Bar (id=1), Other Bookmarks (id=2), Mobile Bookmarks (id=3)
- AI prefers existing folders over creating new ones
- Empty folders are recursively cleaned from AI responses
