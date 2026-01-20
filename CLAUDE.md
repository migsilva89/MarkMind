# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarkMind is a Chrome extension that uses Google's Gemini AI to intelligently organize bookmarks. It replaces Chrome's native bookmark button with AI-powered organization that automatically categorizes bookmarks into appropriate folders.

## Development Setup

This is a vanilla JavaScript Chrome extension (Manifest V3) with no build process or package manager.

### Loading the Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src` folder

### Testing Changes

After making changes, reload the extension in Chrome (click the refresh icon on the extension card in `chrome://extensions/`).

### API Key Setup

The extension requires a Google AI Studio API key (Gemini). Keys are stored in Chrome's local storage via `chrome.storage.local`.

## Architecture

The codebase follows a modular architecture with singleton instances for managers, services, and UI components.

### Entry Point

**popup.js** - Application entry point. Initializes all modules and sets up event handlers. Delegates all logic to specialized managers and components.

### Managers (Singleton Pattern)

- **StateManager** - Centralized state with observable pattern. Tracks bookmarks tree, pending selections, UI state (normal/executing/results), and API key validity. Subscribe to state changes with `subscribe(key, callback)`.

- **OrganizationManager** - Orchestrates the organization workflow. Handles both single bookmark (`addCurrentPage()`) and bulk organization (`organizeBulk()`). Processes AI suggestions and applies changes via bookmark service.

- **BookmarkTreeManager** - Renders the bookmark tree UI with checkboxes. Manages selection state and folder expand/collapse behavior.

- **SettingsManager** - API key management (save/remove/test) and settings panel visibility.

- **UIManager** - DOM element caching and status message display.

### Services (Singleton Pattern)

- **geminiService** - Gemini AI integration. Key method is `suggestOrganization(bookmarks, existingFolders, logger, isSingleBookmark)`. Builds prompts, validates responses, handles folder merging, and removes duplicate bookmarks.

- **bookmarkService** - Wraps Chrome Bookmarks API (getTree, create, move, search, getSubTree).

- **storageService** - Wraps Chrome Storage API for API key persistence.

### UI Components (Singleton Pattern)

- **LogPanel** - Displays operation logs with collapsible panel.
- **ProgressBar** - Shows simulated progress during AI operations.
- **ResultsPreview** - Displays AI suggestions with approve/cancel actions.

### Configuration

- **config/api.js** - Gemini API URL and model settings (temperature, tokens).
- **config/constants.js** - Chrome native folder IDs, limits (MAX_FOLDER_DEPTH=3), UI states, default categories.

### Utilities

- **folderUtils.js** - Folder hierarchy building, native folder detection, bookmark counting.
- **urlUtils.js** - URL cleaning and normalization.
- **domUtils.js** - DOM element creation helpers.

### Key Data Flows

1. **Single Bookmark**: User clicks "Add Current Page" → OrganizationManager checks if URL exists → geminiService.suggestOrganization() → ResultsPreview shows options (move/duplicate/create) → OrganizationManager.processFolder() applies changes

2. **Bulk Organization**: User selects bookmarks → OrganizationManager.organizeBulk() → geminiService analyzes all → ResultsPreview shows folder structure with `isNew` flags → User approves → OrganizationManager processes each folder and moves bookmarks

### Chrome APIs Used

- `chrome.bookmarks` - Tree operations, create, move, search
- `chrome.storage.local` - API key persistence
- `chrome.tabs` - Get current tab for "Add Current Page"

### Business Rules

- Maximum folder depth: 3 levels
- Chrome native folders: Bookmarks Bar (id=1), Other Bookmarks (id=2), Mobile Bookmarks (id=3)
- AI prefers existing folders over creating new ones
- Empty folders are recursively cleaned from AI responses
- Bookmarks must not be duplicated across folders in AI suggestions
